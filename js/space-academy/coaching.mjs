// Display-only coaching: stored question-bank snapshots and feedback codes stay unchanged.
function digitCards(question) {
  const model = question.family === 'number-build' && question.visual?.kind === 'v2-number-digit-cards'
    ? question.visual : null;
  if (!model || !Array.isArray(model.digits) || model.digits.length < 2 || model.digits.length > 8 ||
      !model.digits.every(digit => Number.isSafeInteger(digit) && digit >= 0 && digit <= 9) ||
      !['smallest', 'greatest'].includes(model.order) || ![null, 'even', 'odd'].includes(model.parity) ||
      !(model.limit === null || (['greater', 'less'].includes(model.limit?.direction) &&
        Number.isSafeInteger(model.limit.value) && model.limit.value >= 0))) return null;
  return model;
}

const numberText = value => value.toLocaleString('en-IN');
const sortedDigits = digits => [...digits].sort((a, b) => a - b).join('');

export function coachingHint(question) {
  const model = digitCards(question);
  if (!model) return question.family === 'number-build'
    ? 'Check the number against all the conditions stated in the question.' : question.hint;
  const steps = ['Use every digit card exactly once. The first digit cannot be zero.'];
  if (model.parity) steps.push(`Reserve an ${model.parity} digit for the ones place.`);
  if (model.limit) steps.push(`Check that the number is ${model.limit.direction} than ${numberText(model.limit.value)}.`);
  steps.push(model.parity || model.limit
    ? `Of the arrangements that meet the conditions, choose the ${model.order} number.`
    : model.order === 'greatest'
      ? 'Put larger digits first to make the greatest number.'
      : 'Start with the smallest nonzero digit, then put the remaining digits in increasing order.');
  return steps.join(' ');
}

function digitCardFeedback(model, option) {
  if (typeof option !== 'string' || !/^(0|[1-9]\d*)$/.test(option)) return null;
  const digits = [...option].map(Number);
  if (sortedDigits(digits) !== sortedDigits(model.digits)) {
    return model.digits.includes(0) && !digits.includes(0)
      ? 'The zero card still needs a place in the number. Use every card exactly once, with no zero at the start.'
      : `Use all ${model.digits.length} digit cards exactly once. Do not leave out or repeat a card.`;
  }
  if (model.parity && Number(option.at(-1)) % 2 !== (model.parity === 'even' ? 0 : 1)) {
    return `The number must be ${model.parity}. Check the digit in the ones place.`;
  }
  const value = Number(option);
  if (model.limit && (model.limit.direction === 'greater' ? value <= model.limit.value : value >= model.limit.value)) {
    return `Check the size condition: the number must be ${model.limit.direction} than ${numberText(model.limit.value)}.`;
  }
  return `Compare the digits from left to right to find the ${model.order} number${model.parity || model.limit ? ' that meets all the conditions' : ''}.`;
}

// Null means omit the diagnostic and retain the question's original worked explanation.
export function coachingFeedback(question, index) {
  if (!Number.isSafeInteger(index) || index < 0 || !Array.isArray(question.options) ||
      index >= question.options.length || index === question.correctIndex) return null;
  const feedback = question.feedback?.[index];
  if (!feedback?.code) return null;
  const model = digitCards(question);
  if (model) return digitCardFeedback(model, question.options[index]);
  if (feedback.code === 'place-shift' &&
      !(question.family === 'abacus-change' && question.visual?.kind === 'v2-number-abacus')) return null;
  return feedback.message ?? null;
}

export function coachingFocus(focus) {
  if (focus?.code !== 'place-shift') return focus ?? null;
  return {
    ...focus,
    title: 'Digit order and place value',
    message: 'Check the place occupied by each digit; its value depends on its position in the number.',
  };
}
