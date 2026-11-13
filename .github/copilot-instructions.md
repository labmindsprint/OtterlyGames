# Website layout changes

Read `ARCHITECTURE.md`, especially "Public-page width contract", before changing
public-page layout. Use the existing shared width/gutter tokens and `.wrap`
primitive; do not introduce independent narrow hub or landing-page caps.
Keep article reading measures separate from outer page widths.

Check every route family affected by a shared selector, including later CSS
overrides. Verify rendered inner widths against the header and inspect laptop,
tablet, phone and short-landscape layouts. A passing build or no-overflow check
alone is not proof of correct layout. Preserve intentional reading/widget/game
exceptions and update authoritative sources rather than generated copies.
