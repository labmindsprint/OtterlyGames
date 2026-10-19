function optionAt(question, index) {
  if (!Number.isInteger(index) || index < 0 || typeof question?.options?.[index] !== 'string') {
    throw new RangeError('Choose one of the displayed answers.');
  }
  return question.options[index];
}

export function choiceLabel(question, index) {
  const option = optionAt(question, index);
  return question.optionVisuals?.[index] ? `Picture ${String.fromCharCode(65 + index)}` : option;
}

export function choiceDescription(question, index) {
  const label = choiceLabel(question, index);
  const visual = question.optionVisuals?.[index];
  if (!visual) return label;
  if (typeof visual.description !== 'string' || !visual.description.trim()) {
    throw new Error('A picture answer needs a description of what is shown.');
  }
  return `${label}. ${visual.description}`;
}

export function questionReadAloud(question) {
  return [
    question.prompt,
    question.visual?.description,
    ...question.options.map((_, index) => `Option ${String.fromCharCode(65 + index)}. ${choiceDescription(question, index)}`),
  ].filter(Boolean).join('. ');
}
