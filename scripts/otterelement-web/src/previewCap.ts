import { TRAINING } from './game/data';
import { availablePowers, createGame, isGameState } from './game/model';
import { migrateGuide } from './game/heliumOnboard';
import { PREVIEW_NODE_CAP } from './previewEnv';

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value);

/**
 * Brings a save that is past the preview cap back to the cap. Every read of a save in this build goes through it (the
 * stored save, the checkpoint, an imported file), so no stored or imported state can open a node beyond the cap.
 * Fields that only a later node can hold are reset; when anything still fails the game's own validation, the save
 * becomes a fresh game that has finished the preview.
 */
export function capPreviewSave(value: unknown): unknown {
  if (!isRecord(value)) return value;
  const cleared = value.cleared;
  if (typeof cleared !== 'number' || !Number.isFinite(cleared) || cleared <= PREVIEW_NODE_CAP) return value;
  const unlocked: readonly string[] = availablePowers({ cleared: PREVIEW_NODE_CAP });
  const equipped = typeof value.equippedElement === 'number' && Number.isFinite(value.equippedElement) ? Math.floor(value.equippedElement) : 1;
  const next: Record<string, unknown> = {
    ...value,
    cleared: PREVIEW_NODE_CAP,
    equippedElement: Math.min(PREVIEW_NODE_CAP, Math.max(1, equipped)),
    frames: ['precision'],
    equippedFrame: 'precision',
    bonusElements: [],
    eventLog: [],
    closure: null,
  };
  if (Array.isArray(value.elementMastery)) next.elementMastery = value.elementMastery.map((level: unknown, index: number) => (index < PREVIEW_NODE_CAP ? level : 0));
  if (isRecord(value.training)) {
    next.training = Object.fromEntries(Object.entries(value.training).map(([id, level]) => [id, TRAINING.some((entry) => entry.id === id && entry.unlock > PREVIEW_NODE_CAP) ? 0 : level]));
  }
  if (Array.isArray(value.equippedPowers)) {
    next.equippedPowers = value.equippedPowers.map((power: unknown) => (typeof power === 'string' && unlocked.includes(power) ? power : null));
  }
  if (isRecord(value.powerMastery)) {
    next.powerMastery = Object.fromEntries(Object.entries(value.powerMastery).map(([id, level]) => [id, unlocked.includes(id) ? level : 0]));
  }
  next.heliumGuide = migrateGuide(undefined, PREVIEW_NODE_CAP);
  if (isGameState(next)) return next;
  const fresh = createGame(Date.now());
  return { ...fresh, cleared: PREVIEW_NODE_CAP, equippedElement: PREVIEW_NODE_CAP, tutorialSeen: true, heliumGuide: migrateGuide(undefined, PREVIEW_NODE_CAP) };
}
