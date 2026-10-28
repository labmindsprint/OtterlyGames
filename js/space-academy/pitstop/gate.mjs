// Parental gate: a maths question a grown-up solves in seconds but a young child cannot guess or work out quickly.
// Three wrong answers pause the gate for 30 seconds so it cannot be brute-forced by tapping numbers.
export const GATE_MAX_WRONG = 3;
export const GATE_PAUSE_MS = 30000;

// (a x b) + c with a in 13..19, b in 6..9 and c in 11..39; the answer is always 3 digits (89..210).
export function newChallenge(random = Math.random) {
  const pick = (min, max) => min + Math.floor(random() * (max - min + 1));
  const a = pick(13, 19);
  const b = pick(6, 9);
  const c = pick(11, 39);
  return { text: `${a} × ${b} + ${c}`, answer: a * b + c };
}

export function isCorrect(challenge, typed) {
  const value = String(typed ?? '').trim();
  return /^\d{1,4}$/.test(value) && Number(value) === challenge.answer;
}
