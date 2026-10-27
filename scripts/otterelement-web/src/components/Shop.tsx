import { ShoppingBag } from 'lucide-react';
import type { Act } from './shared';
import './shop.css';

// The Shop screens live in ./shop. The website preview sells nothing: no purchase provider, no recovery and no store
// confirmation are loaded.
export { ShopSheet } from './shop/ShopSheet';

export function ShopButton({ disabled, onOpen }: { disabled: boolean; onOpen(): void }) {
  return <button className="wallet-shop" disabled={disabled} title="Open Shop" aria-label="Open Shop" onClick={onOpen}>
    <ShoppingBag size={18} aria-hidden="true" />
  </button>;
}

export function usePurchaseRecovery(act: Act): void {
  void act;
}

export function PurchaseOverlay(props: { calm: boolean }): null {
  void props;
  return null;
}
