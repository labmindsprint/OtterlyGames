import type { WeekendEvent } from '../game/events';
// The real component also loads the home layout the whole arena page is styled by; only the badge itself is left out.
import './home-layout-v4.css';

export function SiegeBadge(props: { event: WeekendEvent; live: boolean; onOpen(): void }): null {
  void props;
  return null;
}
