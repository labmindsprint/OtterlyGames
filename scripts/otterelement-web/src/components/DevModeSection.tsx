import type { GameState } from '../game/types';

// Developer mode is not part of the website preview.
export const DEV_MODE_TAPS = 7;

export function DevModeSection(props: { game: GameState }): null {
  void props;
  return null;
}
