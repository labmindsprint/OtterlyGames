"""Exercise editorial privacy/ad serving with intercepted fixtures, never live Google requests."""
import argparse
from contextlib import contextmanager
from copy import deepcopy
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
import json
from pathlib import Path
import threading
from urllib.parse import urlsplit
from urllib.request import urlopen

from playwright.sync_api import expect, sync_playwright

ROOT = Path(__file__).resolve().parents[1]
CONFIG = json.loads((ROOT / "_data" / "web-ads.json").read_text(encoding="utf-8"))
FRAGMENT = (ROOT / "_includes" / "editorial-ad.html").read_text(encoding="utf-8")
PROVIDER = (ROOT / "scripts" / "fixtures" / "web-ads-provider.js").read_text(encoding="utf-8")
SDK = "https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-5489426086320283"
EDITORIAL = "[data-editorial-ad]"
LEGACY = "[data-web-game-ad]"
ARTICLE = CONFIG["placements"]["blogArticleEnd"]["paths"][0]
PATHS = [path for placement in CONFIG["placements"].values() for path in placement["paths"]]

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument("--url", help="Existing static preview; otherwise start an isolated localhost server.")
parser.add_argument("--output", type=Path, help="Optional directory outside the repository for advertising UI screenshots.")
parser.add_argument("--preview-editorial", action="store_true",
                    help="Before generated pages are written, add the real fragment/resources to in-memory "
                         "responses only. Does not verify the builder or change source HTML.")
args = parser.parse_args()
if args.url and args.preview_editorial:
    parser.error("--preview-editorial requires the script's own read-only localhost server")
if args.output:
    args.output = args.output.resolve()
    if args.output == ROOT or ROOT in args.output.parents:
        parser.error("--output must be outside the repository")
    args.output.mkdir(parents=True, exist_ok=True)


class StaticHandler(SimpleHTTPRequestHandler):
    def log_message(self, _format, *_args):
        pass

    def do_GET(self):
        route = urlsplit(self.path).path
        if args.preview_editorial and route in PATHS:
            relative = route.strip("/").split("/")
            source = ROOT.joinpath(*relative)
            if route.endswith("/"):
                source /= "index.html"
            html = source.read_text(encoding="utf-8")
            if "data-editorial-ad" not in html:
                resources = ('<link rel="stylesheet" href="/css/web-ads.css">'
                             '<script src="/js/web-game-ads.js" defer></script>')
                html = html.replace("</head>", resources + "</head>", 1)
                marker = "<!-- og:footer:start -->"
                assert html.count(marker) == 1, f"Missing shared footer boundary on {route}"
                html = html.replace(marker, FRAGMENT + "\n" + marker, 1)
            body = html.encode("utf-8")
            self.send_response(200)
            self.send_header("Content-Type", "text/html; charset=utf-8")
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)
            return
        super().do_GET()


@contextmanager
def static_preview():
    if args.url:
        yield args.url.rstrip("/")
        return
    server = ThreadingHTTPServer(("127.0.0.1", 0), partial(StaticHandler, directory=str(ROOT)))
    thread = threading.Thread(target=server.serve_forever, daemon=True)
    thread.start()
    base = f"http://127.0.0.1:{server.server_port}"
    try:
        with urlopen(base + "/_data/web-ads.json", timeout=5) as response:
            assert response.status == 200 and thread.is_alive()
        yield base
    finally:
        server.shutdown()
        server.server_close()
        thread.join(timeout=5)


def observe(browser, base, viewport=(1366, 768), settings=None, response_status=200,
            redirect=False, javascript=True):
    context = browser.new_context(
        viewport={"width": viewport[0], "height": viewport[1]}, java_script_enabled=javascript)
    requests, external, errors, console_errors = [], [], [], []

    def guard(route):
        if urlsplit(route.request.url).netloc != urlsplit(base).netloc:
            external.append(route.request.url)
            route.abort()
        else:
            route.continue_()

    context.route("**/*", guard)
    if settings is not None or response_status != 200 or redirect:
        context.route("**/_data/web-ads.json", lambda route: route.fulfill(
            status=302 if redirect else response_status,
            headers={"Location": "https://example.invalid/ads-config"} if redirect else {},
            content_type="application/json",
            body=json.dumps(settings if settings is not None else CONFIG)))
    context.on("request", lambda request: requests.append(request.url))
    page = context.new_page()
    page.on("pageerror", lambda error: errors.append(str(error)))
    page.on("console", lambda message: console_errors.append(message.text) if message.type == "error" else None)
    return context, page, requests, external, errors, console_errors


def assert_inert(page, selector=EDITORIAL, state="disabled"):
    placement = page.locator(selector)
    expect(placement).to_have_count(1)
    if state:
        expect(placement).to_have_attribute("data-web-ad-state", state)
    expect(placement).not_to_be_visible()
    assert placement.evaluate("""el => el.hidden && el.getClientRects().length === 0 &&
        el.getBoundingClientRect().width === 0 && el.getBoundingClientRect().height === 0""")
    assert page.evaluate("typeof window.adsbygoogle") == "undefined"
    expect(page.locator('script[src*="googlesyndication"], script[src*="doubleclick"]')).to_have_count(0)
    if selector == EDITORIAL:
        expect(placement).to_have_attribute("aria-label", "Advertisement")
        expect(placement.locator(".editorial-ad-label")).to_have_text("Advertisement")
        expect(placement.locator("[data-web-ad-unit] > *")).to_have_count(0)
        assert placement.locator("[data-web-ad-unit]").inner_html() == ""
        assert placement.evaluate("el => !el.closest('article, a, button, form, [role=application]')")
    else:
        assert placement.locator("ins").get_attribute("data-ad-slot") is None


def close_checked(context, external, errors):
    assert not external, f"Third-party requests were attempted (blocked by test): {external}"
    assert not errors, errors
    context.close()


def opted_in(name="blogArticleEnd", verified=False):
    settings = deepcopy(CONFIG)
    settings["enabled"] = True
    settings["siteApprovalVerified"] = verified
    settings["privacySetupVerified"] = True
    settings["placements"][name]["enabled"] = True
    return settings


def check_default_pages(browser, base):
    for viewport in [(1366, 768), (390, 844)]:
        context, page, _, external, errors, console_errors = observe(browser, base, viewport)
        for path in PATHS:
            response = page.goto(base + path, wait_until="networkidle")
            assert response.status == 200, path
            assert_inert(page)
            page.evaluate("document.fonts.ready")
            before = page.evaluate("""() => [document.documentElement.scrollHeight,
                document.querySelector('footer.footer').getBoundingClientRect().top]""")
            page.locator(EDITORIAL).evaluate("el => el.remove()")
            after = page.evaluate("""() => [document.documentElement.scrollHeight,
                document.querySelector('footer.footer').getBoundingClientRect().top]""")
            assert before == after, f"A disabled placement consumed layout space on {path}: {before}, {after}"
        assert not console_errors, console_errors
        close_checked(context, external, errors)
        print(f"PASS {len(PATHS)} disabled editorial pages, zero ad layout cost or third-party requests at {viewport}")

    context, page, _, external, errors, _ = observe(browser, base, javascript=False)
    for path in [ARTICLE, "/parents/"]:
        page.goto(base + path, wait_until="networkidle")
        assert_inert(page, state=None)
    close_checked(context, external, errors)
    print("PASS article and parent placements also collapse without JavaScript")


def check_blocked_config(browser, base):
    invalid = opted_in()
    invalid["placements"]["blogArticleEnd"]["paths"] = ["/tools/calculator.html"]
    cases = [
        (ARTICLE, opted_in(), 200, False, "site-not-approved"),
        ("/parents/", opted_in("parentGuideEnd"), 200, False, "site-not-approved"),
        (ARTICLE, {**opted_in(verified=True), "privacySetupVerified": False}, 200, False, "privacy-not-verified"),
        (ARTICLE, invalid, 200, False, "invalid-configuration"),
        (ARTICLE, CONFIG, 404, False, "configuration-unavailable"),
        (ARTICLE, CONFIG, 200, True, "configuration-unavailable"),
    ]
    for path, settings, status, redirect, code in cases:
        context, page, _, external, errors, console_errors = observe(
            browser, base, settings=settings, response_status=status, redirect=redirect)
        page.goto(base + path, wait_until="networkidle")
        assert_inert(page, state="blocked")
        expect(page.locator(EDITORIAL)).to_have_attribute("data-web-ad-error", code)
        assert any("[Website ads]" in error for error in console_errors), console_errors
        if code == "privacy-not-verified":
            assert any("not visitor consent" in error for error in console_errors), console_errors
        close_checked(context, external, errors)
    print("PASS approval/privacy/placement gates and invalid, missing or redirected config fail before any SDK request")


def provider_page(browser, base, options=None, viewport=(1366, 768), path=ARTICLE):
    name = "parentGuideEnd" if path == "/parents/" else "blogArticleEnd"
    result = observe(browser, base, viewport, settings=opted_in(name, verified=True))
    context, page, *_ = result
    context.add_init_script("window.__webAdFixtureOptions = " + json.dumps(options or {}) + ";")
    context.route(SDK, lambda route: route.fulfill(content_type="application/javascript", body=PROVIDER))
    page.goto(base + path, wait_until="networkidle")
    page.wait_for_function("window.__webAdFixture !== undefined")
    assert page.evaluate("window.__webAdFixture.bootstrap") == {"paused": 1, "nonPersonalized": 1}
    assert page.evaluate("window.googlefc.usstatesoptout?.overrideDnsLink !== true")
    return result


def european_choices(accepted=True):
    return {
        "gdprApplies": True, "cmpStatus": "loaded", "eventStatus": "useractioncomplete",
        "isServiceSpecific": True, "tcString": "TEST_ONLY_NOT_A_REAL_TC_STRING",
        "purpose": {"consents": {"1": accepted},
                    "legitimateInterests": {"2": True, "7": True, "9": True, "10": True}},
        "vendor": {"consents": {"755": accepted}, "legitimateInterests": {"755": True},
                   "disclosedVendors": {"755": True}},
    }


def assert_provider_hidden(page, state, requests=0):
    expect(page.locator(EDITORIAL)).to_have_attribute("data-web-ad-state", state)
    expect(page.locator(EDITORIAL)).not_to_be_visible()
    expect(page.locator("[data-web-ad-unit] > *")).to_have_count(0)
    assert page.evaluate("window.adsbygoogle.pauseAdRequests") == 1
    assert page.evaluate("window.__webAdFixture.requests.length") == requests


def check_provider_flow(browser, base):
    for viewport, path in [((1366, 768), ARTICLE), ((390, 844), "/parents/"),
                           ((320, 740), ARTICLE)]:
        context, page, _, external, errors, console_errors = provider_page(
            browser, base, {"tcf": {"gdprApplies": None}}, viewport, path)
        assert_provider_hidden(page, "waiting-consent")
        assert page.evaluate("window.__webAdFixture.pushes") == 0
        page.evaluate("data => window.__webAdFixture.changeTcf(data)", european_choices())
        expect(page.locator(EDITORIAL)).to_have_attribute("data-web-ad-state", "filled")
        unit = page.locator("[data-web-ad-unit] > ins")
        expect(unit).to_have_attribute("data-ad-client", "ca-pub-5489426086320283")
        expected_slot = opted_in("parentGuideEnd" if path == "/parents/" else "blogArticleEnd")["placements"][
            "parentGuideEnd" if path == "/parents/" else "blogArticleEnd"]["slot"]
        expect(unit).to_have_attribute("data-ad-slot", expected_slot)
        expect(unit).to_have_attribute("data-tag-for-age-treatment", "1")
        expect(unit).to_have_attribute("data-restrict-data-processing", "1")
        assert page.evaluate("window.__webAdFixture.requests[0].nonPersonalized") == 1
        assert page.evaluate("document.documentElement.scrollWidth <= innerWidth")
        assert page.locator("[data-ad-privacy-controls] button").evaluate_all(
            "els => els.every(el => el.getBoundingClientRect().height >= 44)")
        privacy_button = page.get_by_role("button", name="Privacy and cookie settings", exact=True)
        privacy_button.focus()
        page.keyboard.press("Tab")
        expect(page.get_by_role("button", name="Keep ads off on this page", exact=True)).to_be_focused()
        if args.output:
            page.locator("[data-ad-privacy-controls]").scroll_into_view_if_needed()
            page.screenshot(path=str(args.output / f"advertising-{viewport[0]}x{viewport[1]}.png"))
        privacy_button.click()
        assert page.evaluate("window.__webAdFixture.revocations") == 1
        assert_provider_hidden(page, "privacy-changed", requests=1)
        page.evaluate("data => window.__webAdFixture.changeTcf(data)", european_choices(False))
        page.evaluate("data => window.__webAdFixture.changeTcf(data)", european_choices())
        assert_provider_hidden(page, "privacy-changed", requests=1)
        assert not console_errors, console_errors
        close_checked(context, external, errors)
    print("PASS real DOM: pending consent makes no ad request; EU permission serves one protected unit; revision cannot resurrect an ad")

    denied = european_choices(False)
    for data in [denied, {**european_choices(), "vendor": {"consents": {"755": True}}},
                 {**european_choices(), "publisher": {"restrictions": {"1": {"755": 0}}}}]:
        context, page, _, external, errors, console_errors = provider_page(browser, base, {"tcf": data})
        assert_provider_hidden(page, "consent-denied")
        expect(page.get_by_role("button", name="Privacy and cookie settings", exact=True)).to_be_visible()
        assert not console_errors, console_errors
        close_checked(context, external, errors)
    print("PASS EU refusal, undisclosed Google vendor and publisher restrictions never request an ad")

    for region in ["usnat", "usca", "usfl"]:
        context, page, _, external, errors, console_errors = provider_page(browser, base, {"region": region})
        expect(page.locator(EDITORIAL)).to_have_attribute("data-web-ad-state", "filled")
        previous = page.evaluate("window.__webAdFixture.gpp")
        page.locator("[data-mock-google-dns-link]").click()
        expect(page.locator(EDITORIAL)).to_have_attribute("data-web-ad-state", "privacy-changed")
        assert_provider_hidden(page, "privacy-changed", requests=1)
        page.evaluate("data => window.__webAdFixture.changeGpp(data)", previous)
        assert_provider_hidden(page, "privacy-changed", requests=1)
        assert not console_errors, console_errors
        close_checked(context, external, errors)
    print("PASS US National, California and Florida signals; Google's own opt-out control withdraws the unit immediately")

    for options, code in [
        ({"missingTcf": True}, "consent-unavailable"),
        ({"missingGpp": True}, "consent-unavailable"),
        ({"tcfError": True}, "invalid-consent-data"),
        ({"gppError": True}, "invalid-consent-data"),
        ({"tcf": None}, "invalid-consent-data"),
        ({"gpp": {"cmpStatus": "loaded", "signalStatus": "ready"}}, "invalid-consent-data"),
        ({"gpp": {"gppVersion": "1.1", "cmpStatus": "loaded", "signalStatus": "ready",
                  "applicableSections": [5], "gppString": "TEST_ONLY"}}, "unsupported-privacy-region"),
    ]:
        context, page, _, external, errors, console_errors = provider_page(browser, base, options)
        assert_provider_hidden(page, "blocked")
        expect(page.locator(EDITORIAL)).to_have_attribute("data-web-ad-error", code)
        assert console_errors, "Invalid privacy signals must report a failure"
        close_checked(context, external, errors)
    print("PASS missing, failed, malformed and unsupported privacy APIs fail closed with explicit errors")

    context, page, _, external, errors, console_errors = provider_page(browser, base, {"fill": "unfilled"})
    assert_provider_hidden(page, "unfilled", requests=1)
    assert not console_errors, console_errors
    close_checked(context, external, errors)

    context, page, _, external, errors, console_errors = provider_page(browser, base)
    expect(page.locator(EDITORIAL)).to_have_attribute("data-web-ad-state", "filled")
    page.get_by_role("button", name="Keep ads off on this page", exact=True).click()
    assert_provider_hidden(page, "visitor-optout", requests=1)
    assert not console_errors, console_errors
    close_checked(context, external, errors)
    print("PASS no-fill collapses the unit and the visitor can keep ads off without losing content")


def check_unrelated_pages(browser, base):
    context, page, requests, external, errors, _ = observe(browser, base, settings=opted_in())
    for path in ["/", "/blog/", "/play/", "/play/clock-master.html",
                 "/tools/calculator.html", "/learn/telling-time.html"]:
        response = page.goto(base + path, wait_until="networkidle")
        assert response.status == 200, path
        expect(page.locator(EDITORIAL)).to_have_count(0)
        before = sum(urlsplit(url).path == "/_data/web-ads.json" for url in requests)
        page.locator("body").evaluate("(el, html) => el.insertAdjacentHTML('beforeend', html)", FRAGMENT)
        page.add_script_tag(url=base + "/js/web-game-ads.js")
        assert_inert(page, state="ineligible")
        after = sum(urlsplit(url).path == "/_data/web-ads.json" for url in requests)
        assert after == before, f"Unrelated page fetched advertising config: {path}"
    close_checked(context, external, errors)
    print("PASS unrelated game/tool/learning/hub pages have no placement; copying the fragment/helper cannot opt them in")


def check_math_tank(browser, base):
    enabled = {"enabled": True, "privacySetupVerified": True, "mathTankSlot": "1234567890"}
    for settings, state in [(CONFIG, "disabled"), (enabled, "blocked")]:
        context, page, _, external, errors, console_errors = observe(browser, base, settings=settings)
        page.goto(base + "/play/math-tank.html", wait_until="networkidle")
        expect(page.locator(EDITORIAL)).to_have_count(0)
        assert_inert(page, selector=LEGACY, state=state)
        assert page.locator("#universe-frame").get_attribute("src") is None
        if state == "blocked":
            assert any("not visitor consent" in error for error in console_errors), console_errors
        else:
            assert not console_errors, console_errors
        page.get_by_role("button", name="Play Math Tank", exact=True).click()
        expect(page.locator("#universe-frame")).to_be_visible()
        frame = page.frame_locator("#universe-frame")
        frame.get_by_role("button", name="Play Math Tank", exact=True).click()
        expect(frame.get_by_test_id("math-tank-app")).to_be_visible()
        assert_inert(page, selector=LEGACY, state=state)
        close_checked(context, external, errors)
    print("PASS Math Tank's disabled and blocked legacy ad flows do not interfere with real game launch")


with static_preview() as url, sync_playwright() as playwright:
    browser = playwright.chromium.launch()
    try:
        check_default_pages(browser, url)
        check_blocked_config(browser, url)
        check_provider_flow(browser, url)
        check_unrelated_pages(browser, url)
        check_math_tank(browser, url)
    finally:
        browser.close()

if args.preview_editorial:
    print("PASS read-only response fixtures; run again without --preview-editorial after coordinated site generation")
else:
    print("PASS actual static-page editorial and legacy advertising boundaries")
