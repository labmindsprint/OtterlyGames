import type { WeekendEvent } from '../game/events';
import type { Act } from './shared';
import type { GameState } from '../game/types';

export function EventTd(props: { event: WeekendEvent; live: boolean; game: GameState; act: Act; reducedMotion: boolean; onClose(): void }): null {
  void props;
  return null;
}

export function LegacySiegeNotice(): null {
  return null;
}
