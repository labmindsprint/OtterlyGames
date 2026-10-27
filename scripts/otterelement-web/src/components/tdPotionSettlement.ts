import type { ActionResult, GameAction } from '../game/types';

export function sweepSiegePotionSettlements(act: (action: GameAction) => Promise<ActionResult>, now: number): Promise<number> {
  void act;
  void now;
  return Promise.resolve(0);
}
