import type { ProvisionResult } from '../game/td/identity';

// The website preview has no ranking or event service: this host never opens a connection.
// Only the type is read, by the Siege save code that the build never runs.
export type CheckpointResult =
  | { status: 'sent'; nextHour: number }
  | { status: 'queued' }
  | { status: 'rejected'; reason: string; nextHour?: number }
  | { status: 'local' };

export function provisionTdIdentity(): Promise<ProvisionResult> {
  return Promise.resolve({ kind: 'unreachable' });
}

export function startTdOutbox(installId: string): () => void {
  void installId;
  return () => undefined;
}

export function kickTdOutbox(force = false): void {
  void force;
}
