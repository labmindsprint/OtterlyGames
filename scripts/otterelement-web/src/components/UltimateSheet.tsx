import type { GameState } from '../game/types';
import type { Act } from './shared';

// The ultimate element is a paid unlock in the full game; the website preview does not show or sell it.
export function ultimatePrice(): string {
  return '';
}

export function UltimateSheet(props: { game: GameState; act: Act; onClose(): void }): null {
  void props;
  return null;
}
