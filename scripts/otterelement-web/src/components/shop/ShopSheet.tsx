import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { DAILY_CLAIM_MINUTES } from '../../game/catalog';
import { dailyDaysReady } from '../../game/economy';
import { freeSetOpen } from '../../game/heliumOnboard';
import { istResetLabel } from '../../game/istDay';
import { dailyCredits } from '../../game/shop';
import type { GameAction, GameState } from '../../game/types';
import { CoinIcon } from '../CurrencyIcon';
import { useReducedMotion } from '../motion';
import { Modal, number } from '../shared';
import type { Act } from '../shared';
import { ShopMotion, useNow } from './hooks';
import { SHOP_ASSET_KEYS, refreshShopAssets } from './shopAssets';
import { SpriteAnim } from './SpriteAnim';
import { ShopTabs, TabPanel } from './v2/ShopTabs';
import type { ShopTabId } from './v2/shopV2Model';
import { BuyButton, V2Chip, v2Art } from './v2/V2Parts';
import { v2Copy } from './v2/v2Copy';
import './v2/shop-v2.css';

// The website preview's Shop: the free daily pack and the free first potions of the real Shop. Nothing is sold here
// and no ad is shown, so there is no price, no store and no ad control on this screen.
const POTIONS = [
  { kind: 'haste', art: v2Art('ui-v2', 'potion_haste'), tint: '#5fb7ff' },
  { kind: 'might', art: v2Art('ui-v2', 'potion_might'), tint: '#ff7a54' },
  { kind: 'ward', art: v2Art('shop-v2', 'potion_ward'), tint: '#4fdc8a' },
] as const;

const isOpenTab = (tab: ShopTabId | undefined): tab is 'starter' | 'boost' => tab === 'starter' || tab === 'boost';

let lastTab: ShopTabId = 'starter';

export function ShopSheet({ game, act, onClose, page = false, initialTab }: {
  game: GameState; act: Act; adPaused?: boolean; boostOffer?: 'hidden' | 'paused' | 'ready'; onWatchBoost?(): void; onClose?(): void; onOpenLab?(): void; page?: boolean; initialTab?: ShopTabId;
}) {
  const [tab, setTabState] = useState<ShopTabId>(isOpenTab(initialTab) ? initialTab : lastTab);
  const [status, setStatus] = useState('');
  const now = useNow(30_000);
  const calm = useReducedMotion(game.settings.reducedMotion);
  useEffect(() => {
    if (!status) return undefined;
    const timer = window.setTimeout(() => setStatus(''), 8000);
    return () => window.clearTimeout(timer);
  }, [status]);
  const setTab = (next: ShopTabId) => { lastTab = next; setTabState(next); };
  useEffect(() => { if (isOpenTab(initialTab)) { lastTab = initialTab; setTabState(initialTab); } }, [initialTab]);
  useEffect(() => { void refreshShopAssets(true); }, []);

  const spend = async (action: GameAction) => {
    const result = await act(action);
    setStatus(result.message ?? '');
  };
  const days = dailyDaysReady(game.economy, now);
  const ready = days > 0;
  const credits = number(dailyCredits(game) * Math.max(1, days));
  const minutes = DAILY_CLAIM_MINUTES * Math.max(1, days);
  const s = v2Copy.starter;
  const b = v2Copy.boost;

  const wrap = (content: ReactNode) => page
    ? <section className="shop-page" aria-label={v2Copy.title} data-testid="shop-page">{content}</section>
    : <Modal title={v2Copy.title} onClose={onClose ?? (() => undefined)} className="shop-modal">{content}</Modal>;

  return <ShopMotion.Provider value={calm}>
    {wrap(
      <div className={`shop-body ${calm ? 'shop-calm' : ''}`}>
        <p className="shop-status" role="status" aria-live="polite">{status}</p>
        <ShopTabs tab={tab} onTab={setTab} />
        <TabPanel tab={tab}>
          {tab === 'starter' && <div className="v2-stack v2-ladder">
            <article className={`v2-card v2-rung v2-daily ${ready ? '' : 'is-owned'}`} data-item="daily-pack" data-ob="daily-claim">
              <div className="v2-card-art" aria-hidden="true"><SpriteAnim asset={SHOP_ASSET_KEYS.giftBox} width={56} fallback={<CoinIcon size={40} />} /></div>
              <div className="v2-card-body">
                <h4>{s.daily}</h4>
                <ul className="v2-chips is-inline"><V2Chip icon={<CoinIcon size={16} />}>{credits}</V2Chip><V2Chip>{s.dailyLine(minutes)}</V2Chip></ul>
                <p className="v2-speed-line">{s.dailyReset(istResetLabel(now))}</p>
              </div>
              <BuyButton name={s.daily} price={s.free} owned={!ready} ariaLabel={`${s.claim} ${s.daily}`} onBuy={() => void spend({ type: 'claim-daily', now: Date.now() })} />
            </article>
          </div>}
          {tab === 'boost' && <div className="v2-stack">
            {freeSetOpen(game) && <article className="v2-card v2-potion v2-free-set" data-ob="free-potions" data-item="free-potion-set">
              <div className="v2-card-art v2-free-art">{POTIONS.map((p) => <img key={p.kind} src={p.art} width={44} height={44} alt="" draggable={false} style={{ filter: `drop-shadow(0 0 6px ${p.tint}88)` }} />)}</div>
              <div className="v2-card-body"><h4>{b.firstSet}</h4><ul className="v2-chips is-inline">{POTIONS.map((p) => <li key={p.kind} className="v2-chip" aria-label={`${b[p.kind].name} x1`}><img src={p.art} width={18} height={18} alt="" draggable={false} /><b aria-hidden="true">{b.count(1)}</b></li>)}</ul></div>
              <BuyButton name={b.firstSet} price={s.free} ariaLabel={`${s.claim} ${b.firstSet}`} onBuy={() => void spend({ type: 'claim-free-potions' })} />
            </article>}
            {POTIONS.map((p) => <article key={p.kind} className="v2-card v2-potion" data-item={`potion-info-${p.kind}`} style={{ '--tint': p.tint } as React.CSSProperties}>
              <div className="v2-card-art v2-potion-art"><img src={p.art} width={72} height={72} alt="" draggable={false} /></div>
              <div className="v2-card-body"><h4>{b[p.kind].name}</h4><p>{b[p.kind].line}</p><ul className="v2-chips is-inline"><li className="v2-chip"><span>{b.min}</span></li></ul></div>
            </article>)}
            <p className="v2-note">{b.note}</p>
          </div>}
        </TabPanel>
        <div className="shop-foot"><small>Website preview: only the free items are available here.</small></div>
      </div>
    )}
  </ShopMotion.Provider>;
}
