// Shared helpers for the Class 4 paper-style families (bank3-class-4-real-*.mjs).
// A spec is { gen(level, r) -> givens, calc(givens) -> { prompt, answer, wrongs, hint, explanation, visual?, correctVisual? } }.
// solve() recomputes the answer from proof.givens with calc(), so a saved question can never vouch for itself.
import { QuestionRetry, answerChoices, choiceCount, tidyStops, wrong } from './bank-shared.mjs';

export const GIRLS = ['Divya', 'Shreya', 'Kirti', 'Palak', 'Nidhi', 'Megha', 'Neha', 'Sneha', 'Riya', 'Richa', 'Isha', 'Tara', 'Mina', 'Anaya', 'Diya', 'Kavya', 'Meera', 'Priya', 'Zoya', 'Sana'];
export const BOYS = ['Amit', 'Kabir', 'Mohit', 'Ravi', 'Dev', 'Aman', 'Veer', 'Rohan', 'Arjun', 'Imran', 'Sameer', 'Harsh', 'Dinesh', 'Vivan', 'Javed', 'Rahul', 'Ari', 'Sanjay'];
export const NAMES = [...GIRLS, ...BOYS];
export const pronoun = who => GIRLS.includes(who) ? { subject: 'She', object: 'her', own: 'Her' } : { subject: 'He', object: 'him', own: 'His' };
export const pic = (kind, data, description) => ({ kind: `v3-class-4-${kind}`, ...data, description });
export const ordinal = n => `${n}${[11, 12, 13].includes(n % 100) ? 'th' : (['th', 'st', 'nd', 'rd'][n % 10] ?? 'th')}`;
export const mod = (n, m) => ((n % m) + m) % m;
export const gcd = (a, b) => b ? gcd(b, a % b) : a;
export const sumOf = values => values.reduce((a, b) => a + b, 0);
export const rs = value => `Rs ${value}`;
export const plural = (count, one, many = `${one}s`) => `${count} ${count === 1 ? one : many}`;

// A whole number plus a fraction, written the way the printed papers do: 2 11/12, 5/6 or 3.
export function mixedText(numerator, denominator) {
  const divisor = gcd(numerator, denominator) || 1;
  const n = numerator / divisor, d = denominator / divisor;
  const whole = Math.floor(n / d), rest = n - whole * d;
  if (!rest) return String(whole);
  return `${whole ? `${whole} ` : ''}${rest}/${d}`;
}

export function draftFrom(specs, known, family, grade, level, r) {
  const spec = specs[family];
  const givens = spec.gen(level, r);
  const c = spec.calc(givens);
  c.prompt = tidyStops(c.prompt);
  c.hint = tidyStops(c.hint);
  c.explanation = tidyStops(c.explanation);
  const answer = String(c.answer);
  if (c.prompt.length > 200 || words(c.prompt) > 36 || c.explanation.length > 260 || c.hint.length > 140) throw new QuestionRetry('Wording too long.');
  const seen = new Set([answer]);
  const alternatives = [];
  for (const [value, code, visual] of r.shuffle(c.wrongs)) {
    const text = String(value);
    if (seen.has(text) || /^[-\u2212]/.test(text) || /NaN|undefined|Infinity/.test(text)) continue;
    seen.add(text);
    alternatives.push(wrong(text, code, visual ?? null));
  }
  if (alternatives.length < choiceCount(grade) - 1) throw new QuestionRetry('Too few different wrong answers.');
  return {
    family, prompt: c.prompt, answer, hint: c.hint, explanation: c.explanation,
    proof: { family, givens }, ...(c.visual ? { visual: c.visual } : {}),
    choices: answerChoices(answer, alternatives, choiceCount(grade), c.correctVisual ?? null, known),
  };
}

export function solveFrom(specs, question) {
  const spec = specs[question.family];
  const c = spec.calc(question.proof.givens);
  if (c.visual && JSON.stringify(c.visual) !== JSON.stringify(question.visual)) throw new Error('The picture does not match the question.');
  spec.check?.(question, c);
  return String(c.answer);
}

// Every picture choice must be drawn as its own label says, or a wrong claim could pass unnoticed.
export function checkPictures(question, kind, key) {
  if (!question.optionVisuals || question.optionVisuals.length !== question.options.length) throw new Error('Picture choices are missing.');
  question.optionVisuals.forEach((visual, i) => {
    if (visual?.kind !== `v3-class-4-${kind}` || key(visual) !== question.options[i]) throw new Error('A picture does not match its option.');
  });
}

export function words(text) {
  return text.trim().split(/\s+/).length;
}
