import type { WeekendEvent } from '../game/events';

// The website preview has no weekend event: nothing here ever finds one, so no chip, badge or tab can appear.
const NONE: { live: WeekendEvent | null; shown: WeekendEvent | null } = { live: null, shown: null };

export function useLabSiege(): { live: WeekendEvent | null; shown: WeekendEvent | null } {
  return NONE;
}

export function EventChip(props: { event: WeekendEvent; live: boolean; onOpen(): void }): null {
  void props;
  return null;
}
