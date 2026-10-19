// These page-only tries never load the game or touch its saved progress.
export function enhanceLessonSamples(root) {
  for (const sample of root.querySelectorAll('[data-lesson-sample]')) {
    if (sample.dataset.lessonReady) continue;
    const options = [...sample.querySelectorAll('[data-lesson-option]')];
    const correctIndex = Number(sample.dataset.correctIndex);
    const response = sample.querySelector('[data-lesson-response]');
    const feedback = sample.querySelector('[data-lesson-feedback]');
    const retry = sample.querySelector('[data-lesson-retry]');
    const hint = sample.querySelector('[data-lesson-hint]');
    const method = sample.querySelector('[data-lesson-method]');
    if (!options.length || !Number.isInteger(correctIndex) || correctIndex < 0 ||
        correctIndex >= options.length || !response || !feedback || !retry || !hint || !method) continue;

    const document = sample.ownerDocument;
    let selected = null;
    const buttons = options.map((option, index) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'al-answer';
      button.dataset.lessonChoice = String(index);
      button.setAttribute('aria-label', option.dataset.choiceLabel);
      button.setAttribute('aria-pressed', 'false');
      button.setAttribute('aria-controls', `${feedback.id} ${method.id}`);
      const marker = document.createElement('span');
      marker.className = 'al-answer-marker';
      marker.setAttribute('aria-hidden', 'true');
      button.append(...option.childNodes, marker);
      button.addEventListener('click', () => {
        selected = index;
        const correct = index === correctIndex;
        for (const [choice, control] of buttons.entries()) {
          const chosen = choice === index;
          control.setAttribute('aria-pressed', String(chosen));
          control.dataset.result = chosen ? (correct ? 'correct' : 'incorrect') : '';
          control.lastElementChild.textContent = chosen ? (correct ? '✓' : '×') : '';
        }
        feedback.textContent = correct
          ? 'That’s right! See how it works below.'
          : 'Not quite. Try another answer — the hint below can help.';
        response.dataset.state = correct ? 'correct' : 'incorrect';
        hint.open = !correct;
        method.open = correct;
        retry.hidden = false;
      });
      option.replaceWith(button);
      return button;
    });

    retry.addEventListener('click', () => {
      for (const button of buttons) {
        button.setAttribute('aria-pressed', 'false');
        delete button.dataset.result;
        button.lastElementChild.textContent = '';
      }
      feedback.textContent = 'Ready for another go. Choose an answer.';
      delete response.dataset.state;
      hint.open = false;
      method.open = false;
      retry.hidden = true;
      buttons[selected ?? 0].focus();
      selected = null;
    });
    response.hidden = false;
    sample.dataset.lessonReady = 'true';
  }
}

if (typeof document !== 'undefined') enhanceLessonSamples(document);
