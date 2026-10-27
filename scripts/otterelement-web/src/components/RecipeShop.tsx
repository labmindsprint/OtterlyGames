import type { CompoundId, GameState } from '../game/types';
import type { Act } from './shared';

// Recipes can be bought in the full game; the website preview sells nothing, so these never render.
export type Purchase = { kind: 'recipe'; id: CompoundId } | { kind: 'pack' } | { kind: 'restore' };

export function PriceChip(props: { purchase: Purchase; onBuy(purchase: Purchase): void; className?: string }): null {
  void props;
  return null;
}

export function RecipePurchase(props: { purchase: Purchase; game: GameState; act: Act; onClose(): void }): null {
  void props;
  return null;
}
