/* ============================================================================
   OTTERLY GAMES — Main JavaScript
   🦦 Otterly Smart. Learning Through Play.
   ============================================================================ */

// --- Navigation ---
document.addEventListener('DOMContentLoaded', () => {
  const nav = document.querySelector('.nav');
  const toggle = document.querySelector('.nav-toggle');
  const links = document.querySelector('.nav-links');

  // Scroll effect
  window.addEventListener('scroll', () => {
    if (window.scrollY > 10) {
      nav?.classList.add('scrolled');
    } else {
      nav?.classList.remove('scrolled');
    }
  });

  // Mobile toggle
  toggle?.addEventListener('click', () => {
    toggle.classList.toggle('active');
    links?.classList.toggle('open');
  });

  // Close menu on link click
  document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', () => {
      toggle?.classList.remove('active');
      links?.classList.remove('open');
    });
  });

  // --- Scroll Animations ---
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

  document.querySelectorAll('.fade-in, .stagger').forEach(el => observer.observe(el));

  // --- Ko-fi Overlay: intercept all ko-fi links to open the widget panel ---
  document.addEventListener('click', (e) => {
    const link = e.target.closest('a[href*="ko-fi.com/mindsprintlab"]');
    if (!link) return;
    e.preventDefault();
    // Try to open the overlay widget panel
    if (typeof kofiWidgetOverlay !== 'undefined') {
      // The floating-chat widget has a toggle button; simulate clicking it
      const kofiBtn = document.querySelector('.floatingchat-container-wrap, .floatingchat-container-wrap-mo498, [id*="kofi"], .kofi-overlay');
      if (kofiBtn) {
        kofiBtn.click();
        return;
      }
      // Fallback: re-draw the widget (forces it to show)
      kofiWidgetOverlay.draw('mindsprintlab', {
        'type': 'floating-chat',
        'floating-chat.donateButton.text': 'Support me',
        'floating-chat.donateButton.background-color': '#0D9488',
        'floating-chat.donateButton.text-color': '#fff'
      });
    } else {
      // Widget script didn't load — open in new tab as fallback
      window.open('https://ko-fi.com/mindsprintlab', '_blank');
    }
  });
});

// ============================================================================
// MULTIPLICATION TABLE TOOL
// ============================================================================
function initMultiplicationTable() {
  const container = document.getElementById('times-table-container');
  if (!container) return;

  let highlightedTable = 0;

  function renderTable(highlight = 0) {
    let html = '<table class="times-table"><thead><tr><th>×</th>';
    for (let i = 1; i <= 12; i++) html += `<th>${i}</th>`;
    html += '</tr></thead><tbody>';
    
    for (let row = 1; row <= 12; row++) {
      html += `<tr><th>${row}</th>`;
      for (let col = 1; col <= 12; col++) {
        const isHighlight = highlight > 0 && (row === highlight || col === highlight);
        html += `<td class="${isHighlight ? 'highlight' : ''}" title="${row} × ${col} = ${row * col}">${row * col}</td>`;
      }
      html += '</tr>';
    }
    html += '</tbody></table>';
    container.innerHTML = html;
  }

  // Control buttons
  const controls = document.getElementById('times-table-controls');
  if (controls) {
    let btnHtml = '<button class="tool-btn active" data-table="0">All</button>';
    for (let i = 1; i <= 12; i++) {
      btnHtml += `<button class="tool-btn" data-table="${i}">${i}× Table</button>`;
    }
    controls.innerHTML = btnHtml;

    controls.addEventListener('click', (e) => {
      if (e.target.dataset.table !== undefined) {
        const num = parseInt(e.target.dataset.table);
        controls.querySelectorAll('.tool-btn').forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        renderTable(num);
      }
    });
  }

  renderTable();
}

// ============================================================================
// MATH SPEED QUIZ
// ============================================================================
function initMathQuiz() {
  const area = document.getElementById('quiz-area');
  if (!area) return;

  let score = 0, streak = 0, total = 0, timeLeft = 30, timerInterval = null;
  let currentQ = null, difficulty = 'easy', isRunning = false;

  const ops = {
    easy: () => { const a = rand(1,10), b = rand(1,10); return { q: `${a} × ${b}`, a: a*b }; },
    medium: () => {
      const type = rand(0,1);
      if (type === 0) { const a = rand(2,12), b = rand(2,12); return { q: `${a} × ${b}`, a: a*b }; }
      else { const b = rand(2,10), a = b * rand(2,10); return { q: `${a} ÷ ${b}`, a: a/b }; }
    },
    hard: () => {
      const type = rand(0,2);
      if (type === 0) { const a = rand(11,20), b = rand(2,12); return { q: `${a} × ${b}`, a: a*b }; }
      else if (type === 1) { const b = rand(2,12), a = b * rand(5,15); return { q: `${a} ÷ ${b}`, a: a/b }; }
      else { const a = rand(10,50), b = rand(10,50); return { q: `${a} + ${b}`, a: a+b }; }
    }
  };

  function rand(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }

  function generateQuestion() {
    const gen = ops[difficulty]();
    const correct = gen.a;
    const options = new Set([correct]);
    while (options.size < 4) {
      let wrong = correct + rand(-10, 10);
      if (wrong !== correct && wrong > 0) options.add(wrong);
    }
    const shuffled = [...options].sort(() => Math.random() - 0.5);
    currentQ = { ...gen, correct, options: shuffled };
    return currentQ;
  }

  function renderQuiz() {
    area.innerHTML = `
      <div class="quiz-score">
        <div class="quiz-score-item"><div class="quiz-score-value" id="q-score">${score}</div><div class="quiz-score-label">Score</div></div>
        <div class="quiz-score-item"><div class="quiz-score-value" id="q-streak">${streak} 🔥</div><div class="quiz-score-label">Streak</div></div>
        <div class="quiz-score-item"><div class="quiz-score-value" id="q-time">${timeLeft}s</div><div class="quiz-score-label">Time</div></div>
      </div>
      <div class="quiz-timer"><div class="quiz-timer-bar" id="q-timer-bar" style="width:100%"></div></div>
      <div class="quiz-question" id="q-question"></div>
      <div class="quiz-options" id="q-options"></div>
    `;
    nextQuestion();
    startTimer();
  }

  function nextQuestion() {
    const q = generateQuestion();
    document.getElementById('q-question').textContent = q.q;
    const optDiv = document.getElementById('q-options');
    optDiv.innerHTML = q.options.map(o => 
      `<button class="quiz-option" data-val="${o}">${o}</button>`
    ).join('');
    optDiv.querySelectorAll('.quiz-option').forEach(btn => {
      btn.addEventListener('click', () => handleAnswer(parseInt(btn.dataset.val)));
    });
  }

  function handleAnswer(val) {
    total++;
    const btns = document.querySelectorAll('.quiz-option');
    btns.forEach(b => {
      b.disabled = true;
      if (parseInt(b.dataset.val) === currentQ.correct) b.classList.add('correct');
      if (parseInt(b.dataset.val) === val && val !== currentQ.correct) b.classList.add('wrong');
    });

    if (val === currentQ.correct) {
      score += 10 + streak * 2;
      streak++;
    } else {
      streak = 0;
    }

    document.getElementById('q-score').textContent = score;
    document.getElementById('q-streak').textContent = streak + ' 🔥';

    setTimeout(nextQuestion, 800);
  }

  function startTimer() {
    isRunning = true;
    const startTime = timeLeft;
    timerInterval = setInterval(() => {
      timeLeft--;
      document.getElementById('q-time').textContent = timeLeft + 's';
      document.getElementById('q-timer-bar').style.width = (timeLeft / startTime * 100) + '%';
      if (timeLeft <= 0) {
        clearInterval(timerInterval);
        isRunning = false;
        showResults();
      }
    }, 1000);
  }

  function showResults() {
    area.innerHTML = `
      <div style="text-align:center;padding:2rem;">
        <div style="font-size:4rem;margin-bottom:1rem;">🏆</div>
        <h3 style="font-size:1.5rem;margin-bottom:0.5rem;">Time's Up!</h3>
        <p style="color:var(--gray-500);margin-bottom:1.5rem;">Great job, Math Champ!</p>
        <div class="quiz-score" style="margin-bottom:2rem;">
          <div class="quiz-score-item"><div class="quiz-score-value">${score}</div><div class="quiz-score-label">Final Score</div></div>
          <div class="quiz-score-item"><div class="quiz-score-value">${total}</div><div class="quiz-score-label">Questions</div></div>
          <div class="quiz-score-item"><div class="quiz-score-value">${streak}</div><div class="quiz-score-label">Best Streak</div></div>
        </div>
        <button class="btn btn-primary" onclick="startQuiz()">Play Again 🚀</button>
      </div>
    `;
  }

  // Expose globally
  window.startQuiz = () => {
    score = 0; streak = 0; total = 0; timeLeft = 30;
    if (timerInterval) clearInterval(timerInterval);
    renderQuiz();
  };

  window.setQuizDifficulty = (d) => {
    difficulty = d;
    document.querySelectorAll('#quiz-controls .tool-btn').forEach(b => b.classList.remove('active'));
    document.querySelector(`[data-difficulty="${d}"]`)?.classList.add('active');
    if (isRunning) {
      clearInterval(timerInterval);
      score = 0; streak = 0; total = 0; timeLeft = 30;
      renderQuiz();
    }
  };

  // Initial state
  area.innerHTML = `
    <div style="text-align:center;padding:3rem;">
      <div style="font-size:4rem;margin-bottom:1rem;">🧮</div>
      <h3 style="font-size:1.5rem;margin-bottom:0.5rem;">Ready to test your math skills?</h3>
      <p style="color:var(--gray-500);margin-bottom:1.5rem;">Answer as many questions as you can in 30 seconds!</p>
      <button class="btn btn-primary btn-lg" onclick="startQuiz()">Start Quiz 🚀</button>
    </div>
  `;
}

// ============================================================================
// SPELLING BEE
// ============================================================================
function initSpellingBee() {
  const area = document.getElementById('spelling-area');
  if (!area) return;

  const words = {
    easy: [
      { word: 'cat', hint: 'A furry pet that says meow' },
      { word: 'dog', hint: 'A loyal pet that barks' },
      { word: 'sun', hint: 'The bright star in our sky' },
      { word: 'moon', hint: 'It shines at night' },
      { word: 'fish', hint: 'It swims in water' },
      { word: 'bird', hint: 'It can fly in the sky' },
      { word: 'tree', hint: 'It has leaves and branches' },
      { word: 'book', hint: 'You read stories in it' },
      { word: 'star', hint: 'Twinkle twinkle little...' },
      { word: 'rain', hint: 'Water falling from clouds' },
      { word: 'cake', hint: 'A sweet birthday treat' },
      { word: 'ball', hint: 'Round toy you can throw' },
      { word: 'duck', hint: 'A bird that says quack' },
      { word: 'frog', hint: 'A green animal that hops' },
      { word: 'milk', hint: 'A white drink from cows' }
    ],
    medium: [
      { word: 'school', hint: 'Where children go to learn' },
      { word: 'friend', hint: 'Someone you like to play with' },
      { word: 'garden', hint: 'Where flowers grow' },
      { word: 'planet', hint: 'Earth is one of these' },
      { word: 'monkey', hint: 'An animal that loves bananas' },
      { word: 'purple', hint: 'A color mixing red and blue' },
      { word: 'bridge', hint: 'You walk over water on this' },
      { word: 'orange', hint: 'A citrus fruit and a color' },
      { word: 'castle', hint: 'Where kings and queens live' },
      { word: 'rocket', hint: 'It flies into space' },
      { word: 'turtle', hint: 'A slow animal with a shell' },
      { word: 'winter', hint: 'The coldest season' },
      { word: 'jungle', hint: 'A thick tropical forest' },
      { word: 'kitten', hint: 'A baby cat' },
      { word: 'rabbit', hint: 'An animal with long ears that hops' }
    ],
    hard: [
      { word: 'beautiful', hint: 'Very pretty to look at' },
      { word: 'wonderful', hint: 'Something amazing and great' },
      { word: 'adventure', hint: 'An exciting journey or experience' },
      { word: 'knowledge', hint: 'What you gain from learning' },
      { word: 'chocolate', hint: 'A sweet brown treat' },
      { word: 'butterfly', hint: 'A colorful insect with wings' },
      { word: 'dinosaur', hint: 'Ancient reptile, now extinct' },
      { word: 'astronaut', hint: 'A person who travels to space' },
      { word: 'invisible', hint: 'Cannot be seen' },
      { word: 'celebrate', hint: 'To have a party for something special' },
      { word: 'excellent', hint: 'Extremely good, outstanding' },
      { word: 'emergency', hint: 'A sudden serious situation' },
      { word: 'important', hint: 'Something that matters a lot' },
      { word: 'education', hint: 'The process of learning' },
      { word: 'telescope', hint: 'Used to see faraway stars' }
    ]
  };

  let currentWord = null, scoreCorrect = 0, scoreTotal = 0;
  let level = 'easy';

  function pickWord() {
    const pool = words[level];
    currentWord = pool[Math.floor(Math.random() * pool.length)];
    return currentWord;
  }

  function renderSpelling() {
    pickWord();
    area.innerHTML = `
      <div class="quiz-score" style="margin-bottom:1.5rem;">
        <div class="quiz-score-item"><div class="quiz-score-value" id="sp-correct">${scoreCorrect}</div><div class="quiz-score-label">Correct</div></div>
        <div class="quiz-score-item"><div class="quiz-score-value" id="sp-total">${scoreTotal}</div><div class="quiz-score-label">Attempted</div></div>
      </div>
      <div class="spelling-word" id="sp-hint">💡 <strong>Hint:</strong> ${currentWord.hint}</div>
      <div style="margin-bottom:1rem;">
        <button class="btn btn-sm btn-secondary" id="sp-speak" title="Listen to the word">🔊 Hear the Word</button>
      </div>
      <input type="text" class="spelling-input" id="sp-input" placeholder="Type the word..." autocomplete="off" autocapitalize="off" />
      <div class="spelling-hint" id="sp-feedback"></div>
      <div style="margin-top:1.5rem;display:flex;gap:0.5rem;justify-content:center;">
        <button class="btn btn-primary btn-sm" id="sp-check">Check ✓</button>
        <button class="btn btn-secondary btn-sm" id="sp-skip">Skip →</button>
      </div>
    `;

    const input = document.getElementById('sp-input');
    const feedback = document.getElementById('sp-feedback');

    document.getElementById('sp-speak').addEventListener('click', () => {
      if ('speechSynthesis' in window) {
        const utter = new SpeechSynthesisUtterance(currentWord.word);
        utter.rate = 0.8;
        speechSynthesis.speak(utter);
      }
    });

    // Speak automatically
    if ('speechSynthesis' in window) {
      setTimeout(() => {
        const utter = new SpeechSynthesisUtterance(currentWord.word);
        utter.rate = 0.8;
        speechSynthesis.speak(utter);
      }, 500);
    }

    document.getElementById('sp-check').addEventListener('click', checkAnswer);
    document.getElementById('sp-skip').addEventListener('click', () => {
      scoreTotal++;
      feedback.textContent = `The word was: "${currentWord.word}"`;
      feedback.style.color = 'var(--coral-pink)';
      setTimeout(() => renderSpelling(), 1500);
    });

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') checkAnswer();
    });

    input.focus();

    function checkAnswer() {
      const val = input.value.trim().toLowerCase();
      scoreTotal++;
      if (val === currentWord.word.toLowerCase()) {
        scoreCorrect++;
        input.classList.add('correct');
        feedback.textContent = '🎉 Correct! Great spelling!';
        feedback.style.color = '#10B981';
        setTimeout(() => renderSpelling(), 1200);
      } else {
        input.classList.add('wrong');
        feedback.textContent = `Not quite! The correct spelling is "${currentWord.word}"`;
        feedback.style.color = 'var(--coral-pink)';
        setTimeout(() => renderSpelling(), 2000);
      }
    }
  }

  window.setSpellingLevel = (l) => {
    level = l;
    scoreCorrect = 0; scoreTotal = 0;
    document.querySelectorAll('#spelling-controls .tool-btn').forEach(b => b.classList.remove('active'));
    document.querySelector(`[data-spelling="${l}"]`)?.classList.add('active');
    renderSpelling();
  };

  renderSpelling();
}

// ============================================================================
// KID CALCULATOR
// ============================================================================
function initCalculator() {
  const display = document.getElementById('calc-display');
  if (!display) return;

  let current = '0', previous = '', operator = '', resetNext = false;

  function updateDisplay() {
    display.textContent = current || '0';
  }

  window.calcInput = (val) => {
    if (resetNext) { current = ''; resetNext = false; }
    if (val === '.' && current.includes('.')) return;
    if (current === '0' && val !== '.') current = val;
    else current += val;
    updateDisplay();
  };

  window.calcOp = (op) => {
    if (operator && !resetNext) calcEquals();
    previous = current;
    operator = op;
    resetNext = true;
  };

  window.calcEquals = () => {
    if (!operator || !previous) return;
    const a = parseFloat(previous);
    const b = parseFloat(current);
    let result;
    switch (operator) {
      case '+': result = a + b; break;
      case '-': result = a - b; break;
      case '×': result = a * b; break;
      case '÷': result = b !== 0 ? a / b : 'Oops!'; break;
    }
    current = typeof result === 'number' ? String(Math.round(result * 10000) / 10000) : result;
    operator = '';
    previous = '';
    resetNext = true;
    updateDisplay();
  };

  window.calcClear = () => {
    current = '0';
    previous = '';
    operator = '';
    resetNext = false;
    updateDisplay();
  };

  updateDisplay();
}

// ============================================================================
// MULTIPLICATION PRACTICE (Table Study + Drill) — from Math Tank
// ============================================================================
function initMultiplicationPractice() {
  const area = document.getElementById('mult-practice-area');
  if (!area) return;

  const TABLE_NUMBERS = [2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20];
  let selectedTable = 2;
  let phase = 'study'; // study | practice | result
  let questions = [], currentQ = 0, correct = 0, streak = 0, bestStreak = 0;

  const CORRECT_MSG = ["Amazing! 🌟","You got it! ⭐","Super smart! 🧠","Fantastic! 🎉","Brilliant! ✨","Way to go! 🚀","Perfect! 💯","Awesome! 🎯","Great job! 👏","You're a star! ⭐"];

  function rand(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
  function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

  function generateQuestions() {
    const qs = [];
    const multipliers = Array.from({length: 10}, (_, i) => i + 1);
    multipliers.sort(() => Math.random() - 0.5);
    multipliers.forEach(m => {
      qs.push({ num1: selectedTable, num2: m, answer: selectedTable * m, prompt: `${selectedTable} × ${m} = ?` });
    });
    return qs;
  }

  function renderStudy() {
    phase = 'study';
    const rows = Array.from({length: 10}, (_, i) => ({
      multiplier: i + 1,
      result: selectedTable * (i + 1)
    }));

    area.innerHTML = `
      <div style="margin-bottom:1.5rem;">
        <p style="font-weight:700;color:var(--deep-navy);margin-bottom:0.75rem;">Select a table to study:</p>
        <div class="tool-controls" id="mp-table-select">
          ${TABLE_NUMBERS.map(n => `<button class="tool-btn${n === selectedTable ? ' active' : ''}" data-t="${n}">${n}×</button>`).join('')}
        </div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:0.5rem;max-width:500px;margin:0 auto 1.5rem;">
        ${rows.map((r, i) => `
          <div style="display:flex;align-items:center;justify-content:space-between;padding:0.75rem 1rem;background:var(--gray-50);border-radius:var(--radius-md);border:1px solid var(--gray-200);animation:fadeInUp 0.3s ease ${i * 0.05}s both;">
            <span style="font-family:var(--font-heading);font-weight:700;color:var(--gray-600);">${selectedTable} × ${r.multiplier}</span>
            <span style="font-family:var(--font-heading);font-weight:800;color:var(--ocean-teal);font-size:1.125rem;">= ${r.result}</span>
          </div>
        `).join('')}
      </div>
      <div style="text-align:center;">
        <button class="btn btn-primary btn-lg" id="mp-start">I'm Ready! Let's Practice! 🚀</button>
      </div>
    `;

    document.getElementById('mp-table-select').addEventListener('click', e => {
      if (e.target.dataset.t) {
        selectedTable = parseInt(e.target.dataset.t);
        renderStudy();
      }
    });
    document.getElementById('mp-start').addEventListener('click', () => {
      questions = generateQuestions();
      currentQ = 0; correct = 0; streak = 0; bestStreak = 0;
      renderPractice();
    });
  }

  function renderPractice() {
    phase = 'practice';
    const q = questions[currentQ];
    area.innerHTML = `
      <div style="display:flex;justify-content:space-between;margin-bottom:1rem;font-size:0.875rem;color:var(--gray-400);">
        <span>Question ${currentQ + 1} of ${questions.length}</span>
        <span>✅ ${correct} | 🔥 ${streak}</span>
      </div>
      <div style="width:100%;height:4px;background:var(--gray-200);border-radius:2px;margin-bottom:1.5rem;">
        <div style="height:100%;width:${(currentQ / questions.length) * 100}%;background:linear-gradient(90deg,var(--ocean-teal),var(--warm-amber));border-radius:2px;transition:width 0.3s;"></div>
      </div>
      <div class="quiz-question" style="font-size:2.5rem;">${q.prompt}</div>
      <div style="text-align:center;margin-bottom:1rem;">
        <input type="text" id="mp-input" class="spelling-input" style="font-size:2rem;max-width:200px;" inputmode="numeric" pattern="[0-9]*" autocomplete="off" placeholder="?" />
      </div>
      <div id="mp-feedback" style="text-align:center;min-height:40px;font-family:var(--font-heading);font-weight:700;font-size:1.125rem;"></div>
      <div id="mp-numpad" style="display:grid;grid-template-columns:repeat(5,1fr);gap:0.5rem;max-width:350px;margin:1rem auto 0;">
        ${[1,2,3,4,5,6,7,8,9,0].map(n => `<button class="calc-btn number" data-n="${n}">${n}</button>`).join('')}
      </div>
    `;

    const input = document.getElementById('mp-input');
    const feedback = document.getElementById('mp-feedback');
    input.focus();

    function checkAnswer() {
      const val = input.value.trim();
      if (!val) return;
      const num = parseInt(val);
      if (num === q.answer) {
        correct++;
        streak++;
        if (streak > bestStreak) bestStreak = streak;
        input.classList.add('correct');
        feedback.textContent = pick(CORRECT_MSG);
        feedback.style.color = '#10B981';
      } else {
        streak = 0;
        input.classList.add('wrong');
        feedback.textContent = `Not quite! ${q.num1} × ${q.num2} = ${q.answer}`;
        feedback.style.color = 'var(--coral-pink)';
      }
      input.disabled = true;
      currentQ++;
      setTimeout(() => {
        if (currentQ < questions.length) renderPractice();
        else renderResult();
      }, num === q.answer ? 1200 : 2000);
    }

    // Auto-check when input length matches answer length
    input.addEventListener('input', () => {
      if (input.value.length >= String(q.answer).length) {
        checkAnswer();
      }
    });

    input.addEventListener('keydown', e => { if (e.key === 'Enter') checkAnswer(); });

    document.getElementById('mp-numpad').addEventListener('click', e => {
      if (e.target.dataset.n !== undefined && !input.disabled) {
        input.value += e.target.dataset.n;
        input.dispatchEvent(new Event('input'));
      }
    });
  }

  function renderResult() {
    const pct = Math.round((correct / questions.length) * 100);
    const emoji = pct >= 90 ? '🏆' : pct >= 70 ? '⭐' : pct >= 50 ? '👍' : '💪';
    area.innerHTML = `
      <div style="text-align:center;padding:2rem;">
        <div style="font-size:4rem;margin-bottom:1rem;">${emoji}</div>
        <h3 style="font-size:1.5rem;margin-bottom:0.5rem;">Practice Complete!</h3>
        <p style="color:var(--gray-500);margin-bottom:1.5rem;">${selectedTable}× Table — ${pct >= 80 ? 'Excellent work!' : 'Keep practicing, you\'ll get there!'}</p>
        <div class="quiz-score" style="margin-bottom:2rem;">
          <div class="quiz-score-item"><div class="quiz-score-value">${correct}/${questions.length}</div><div class="quiz-score-label">Correct</div></div>
          <div class="quiz-score-item"><div class="quiz-score-value">${pct}%</div><div class="quiz-score-label">Accuracy</div></div>
          <div class="quiz-score-item"><div class="quiz-score-value">${bestStreak} 🔥</div><div class="quiz-score-label">Best Streak</div></div>
        </div>
        <div style="display:flex;gap:0.75rem;justify-content:center;flex-wrap:wrap;">
          <button class="btn btn-primary" id="mp-again">Practice Again 🔄</button>
          <button class="btn btn-secondary" id="mp-back">Study Table 📖</button>
        </div>
      </div>
    `;
    document.getElementById('mp-again').addEventListener('click', () => {
      questions = generateQuestions();
      currentQ = 0; correct = 0; streak = 0; bestStreak = 0;
      renderPractice();
    });
    document.getElementById('mp-back').addEventListener('click', renderStudy);
  }

  renderStudy();
}

// ============================================================================
// DIVISION PRACTICE (Table Study + Drill) — from Math Tank
// ============================================================================
function initDivisionPractice() {
  const area = document.getElementById('div-practice-area');
  if (!area) return;

  const TABLE_NUMBERS = [2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20];
  let selectedTable = 2;
  let phase = 'study';
  let questions = [], currentQ = 0, correct = 0, streak = 0, bestStreak = 0;

  const CORRECT_MSG = ["Amazing! 🌟","You got it! ⭐","Super smart! 🧠","Fantastic! 🎉","Brilliant! ✨","Way to go! 🚀","Perfect! 💯","Awesome! 🎯","Great job! 👏","You're a star! ⭐"];

  function rand(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
  function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

  function generateQuestions() {
    const qs = [];
    const multipliers = Array.from({length: 10}, (_, i) => i + 1);
    multipliers.sort(() => Math.random() - 0.5);
    multipliers.forEach(m => {
      const dividend = selectedTable * m;
      qs.push({ dividend, divisor: selectedTable, answer: m, prompt: `${dividend} ÷ ${selectedTable} = ?` });
    });
    return qs;
  }

  function renderStudy() {
    const rows = Array.from({length: 10}, (_, i) => ({
      multiplier: i + 1,
      result: selectedTable * (i + 1)
    }));

    area.innerHTML = `
      <div style="margin-bottom:1.5rem;">
        <p style="font-weight:700;color:var(--deep-navy);margin-bottom:0.75rem;">Select a division table:</p>
        <div class="tool-controls" id="dp-table-select">
          ${TABLE_NUMBERS.map(n => `<button class="tool-btn${n === selectedTable ? ' active' : ''}" data-t="${n}">÷${n}</button>`).join('')}
        </div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:0.5rem;max-width:500px;margin:0 auto 1.5rem;">
        ${rows.map((r, i) => `
          <div style="display:flex;align-items:center;justify-content:space-between;padding:0.75rem 1rem;background:var(--gray-50);border-radius:var(--radius-md);border:1px solid var(--gray-200);">
            <span style="font-family:var(--font-heading);font-weight:700;color:var(--gray-600);">${r.result} ÷ ${selectedTable}</span>
            <span style="font-family:var(--font-heading);font-weight:800;color:var(--lavender);font-size:1.125rem;">= ${r.multiplier}</span>
          </div>
        `).join('')}
      </div>
      <div style="text-align:center;">
        <button class="btn btn-primary btn-lg" id="dp-start">I'm Ready! Let's Practice! 🚀</button>
      </div>
    `;

    document.getElementById('dp-table-select').addEventListener('click', e => {
      if (e.target.dataset.t) { selectedTable = parseInt(e.target.dataset.t); renderStudy(); }
    });
    document.getElementById('dp-start').addEventListener('click', () => {
      questions = generateQuestions();
      currentQ = 0; correct = 0; streak = 0; bestStreak = 0;
      renderPractice();
    });
  }

  function renderPractice() {
    const q = questions[currentQ];
    area.innerHTML = `
      <div style="display:flex;justify-content:space-between;margin-bottom:1rem;font-size:0.875rem;color:var(--gray-400);">
        <span>Question ${currentQ + 1} of ${questions.length}</span>
        <span>✅ ${correct} | 🔥 ${streak}</span>
      </div>
      <div style="width:100%;height:4px;background:var(--gray-200);border-radius:2px;margin-bottom:1.5rem;">
        <div style="height:100%;width:${(currentQ / questions.length) * 100}%;background:linear-gradient(90deg,var(--lavender),var(--coral-pink));border-radius:2px;transition:width 0.3s;"></div>
      </div>
      <div class="quiz-question" style="font-size:2.5rem;">${q.prompt}</div>
      <div style="text-align:center;margin-bottom:1rem;">
        <input type="text" id="dp-input" class="spelling-input" style="font-size:2rem;max-width:200px;" inputmode="numeric" pattern="[0-9]*" autocomplete="off" placeholder="?" />
      </div>
      <div id="dp-feedback" style="text-align:center;min-height:40px;font-family:var(--font-heading);font-weight:700;font-size:1.125rem;"></div>
      <div id="dp-numpad" style="display:grid;grid-template-columns:repeat(5,1fr);gap:0.5rem;max-width:350px;margin:1rem auto 0;">
        ${[1,2,3,4,5,6,7,8,9,0].map(n => `<button class="calc-btn number" data-n="${n}">${n}</button>`).join('')}
      </div>
    `;

    const input = document.getElementById('dp-input');
    const feedback = document.getElementById('dp-feedback');
    input.focus();

    function checkAnswer() {
      const val = input.value.trim();
      if (!val) return;
      const num = parseInt(val);
      if (num === q.answer) {
        correct++; streak++;
        if (streak > bestStreak) bestStreak = streak;
        input.classList.add('correct');
        feedback.textContent = pick(CORRECT_MSG);
        feedback.style.color = '#10B981';
      } else {
        streak = 0;
        input.classList.add('wrong');
        feedback.textContent = `Not quite! ${q.dividend} ÷ ${q.divisor} = ${q.answer}`;
        feedback.style.color = 'var(--coral-pink)';
      }
      input.disabled = true;
      currentQ++;
      setTimeout(() => {
        if (currentQ < questions.length) renderPractice();
        else renderResult();
      }, num === q.answer ? 1200 : 2000);
    }

    input.addEventListener('input', () => { if (input.value.length >= String(q.answer).length) checkAnswer(); });
    input.addEventListener('keydown', e => { if (e.key === 'Enter') checkAnswer(); });
    document.getElementById('dp-numpad').addEventListener('click', e => {
      if (e.target.dataset.n !== undefined && !input.disabled) {
        input.value += e.target.dataset.n;
        input.dispatchEvent(new Event('input'));
      }
    });
  }

  function renderResult() {
    const pct = Math.round((correct / questions.length) * 100);
    const emoji = pct >= 90 ? '🏆' : pct >= 70 ? '⭐' : pct >= 50 ? '👍' : '💪';
    area.innerHTML = `
      <div style="text-align:center;padding:2rem;">
        <div style="font-size:4rem;margin-bottom:1rem;">${emoji}</div>
        <h3 style="font-size:1.5rem;margin-bottom:0.5rem;">Practice Complete!</h3>
        <p style="color:var(--gray-500);margin-bottom:1.5rem;">÷${selectedTable} Table — ${pct >= 80 ? 'Excellent work!' : 'Keep practicing!'}</p>
        <div class="quiz-score" style="margin-bottom:2rem;">
          <div class="quiz-score-item"><div class="quiz-score-value">${correct}/${questions.length}</div><div class="quiz-score-label">Correct</div></div>
          <div class="quiz-score-item"><div class="quiz-score-value">${pct}%</div><div class="quiz-score-label">Accuracy</div></div>
          <div class="quiz-score-item"><div class="quiz-score-value">${bestStreak} 🔥</div><div class="quiz-score-label">Best Streak</div></div>
        </div>
        <div style="display:flex;gap:0.75rem;justify-content:center;flex-wrap:wrap;">
          <button class="btn btn-primary" id="dp-again">Practice Again 🔄</button>
          <button class="btn btn-secondary" id="dp-back">Study Table 📖</button>
        </div>
      </div>
    `;
    document.getElementById('dp-again').addEventListener('click', () => {
      questions = generateQuestions();
      currentQ = 0; correct = 0; streak = 0; bestStreak = 0;
      renderPractice();
    });
    document.getElementById('dp-back').addEventListener('click', renderStudy);
  }

  renderStudy();
}

// ============================================================================
// COLUMN MULTIPLICATION PRACTICE — from Math Tank
// ============================================================================
function initColumnMultiplication() {
  const area = document.getElementById('column-mult-area');
  if (!area) return;

  let correct = 0, total = 0;

  function rand(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }

  function generate() {
    const num1 = rand(11, 19);
    const num2 = rand(11, 19);
    const onesDigit2 = num2 % 10;
    const tensDigit2 = Math.floor(num2 / 10);
    const partial1 = num1 * onesDigit2;
    const partial2 = num1 * tensDigit2;
    const answer = num1 * num2;
    return { num1, num2, onesDigit2, tensDigit2, partial1, partial2, answer };
  }

  function renderQuestion() {
    const q = generate();
    area.innerHTML = `
      <div style="display:flex;justify-content:space-between;margin-bottom:1rem;font-size:0.875rem;color:var(--gray-400);">
        <span>Column Multiplication</span>
        <span>✅ ${correct} / ${total}</span>
      </div>
      <div style="max-width:360px;margin:0 auto;font-family:var(--font-heading);">
        <!-- Problem display -->
        <div style="text-align:right;padding:0.5rem 1rem;font-size:1.75rem;font-weight:800;color:var(--deep-navy);">${q.num1}</div>
        <div style="text-align:right;padding:0.5rem 1rem;font-size:1.75rem;font-weight:800;color:var(--deep-navy);border-bottom:3px solid var(--deep-navy);">× ${q.num2}</div>
        
        <!-- Step 1: Partial product 1 (num1 × ones digit) -->
        <div style="padding:0.75rem 0;">
          <p style="font-size:0.8125rem;color:var(--gray-400);margin-bottom:0.5rem;">Step 1: ${q.num1} × ${q.onesDigit2} (ones digit) = ?</p>
          <div style="display:flex;justify-content:flex-end;gap:0.5rem;align-items:center;">
            <input type="text" class="col-input" id="p1" inputmode="numeric" maxlength="3" style="width:100px;padding:0.75rem;text-align:center;font-size:1.5rem;font-weight:700;border:2px solid var(--gray-200);border-radius:var(--radius-md);font-family:var(--font-heading);" placeholder="?" autocomplete="off" />
          </div>
        </div>

        <!-- Step 2: Partial product 2 (num1 × tens digit, shifted) -->
        <div style="padding:0.75rem 0;">
          <p style="font-size:0.8125rem;color:var(--gray-400);margin-bottom:0.5rem;">Step 2: ${q.num1} × ${q.tensDigit2} (tens digit) = ? (write with 0)</p>
          <div style="display:flex;justify-content:flex-end;gap:0.5rem;align-items:center;">
            <input type="text" class="col-input" id="p2" inputmode="numeric" maxlength="4" style="width:100px;padding:0.75rem;text-align:center;font-size:1.5rem;font-weight:700;border:2px solid var(--gray-200);border-radius:var(--radius-md);font-family:var(--font-heading);" placeholder="?0" autocomplete="off" />
          </div>
        </div>

        <!-- Step 3: Total -->
        <div style="padding:0.75rem 0;border-top:3px solid var(--deep-navy);">
          <p style="font-size:0.8125rem;color:var(--gray-400);margin-bottom:0.5rem;">Step 3: Add them together = ?</p>
          <div style="display:flex;justify-content:flex-end;gap:0.5rem;align-items:center;">
            <input type="text" class="col-input" id="total" inputmode="numeric" maxlength="4" style="width:100px;padding:0.75rem;text-align:center;font-size:1.5rem;font-weight:700;border:2px solid var(--ocean-teal);border-radius:var(--radius-md);font-family:var(--font-heading);" placeholder="?" autocomplete="off" />
          </div>
        </div>

        <div id="col-feedback" style="text-align:center;min-height:60px;padding:1rem;font-family:var(--font-heading);font-weight:700;font-size:1rem;"></div>
        <div style="text-align:center;">
          <button class="btn btn-primary" id="col-check">Check Answer ✓</button>
        </div>
      </div>
    `;

    document.getElementById('p1').focus();

    // Auto-advance focus
    ['p1','p2','total'].forEach((id, i, arr) => {
      document.getElementById(id).addEventListener('input', function() {
        if (this.value.length >= parseInt(this.maxLength) - 1 && i < arr.length - 1) {
          document.getElementById(arr[i+1]).focus();
        }
      });
    });

    document.getElementById('col-check').addEventListener('click', () => {
      const p1Val = parseInt(document.getElementById('p1').value) || 0;
      const p2Val = parseInt(document.getElementById('p2').value) || 0;
      const totalVal = parseInt(document.getElementById('total').value) || 0;
      const feedback = document.getElementById('col-feedback');

      total++;
      const p1OK = p1Val === q.partial1;
      const p2OK = p2Val === q.partial2 * 10;
      const totalOK = totalVal === q.answer;

      document.getElementById('p1').style.borderColor = p1OK ? '#10B981' : '#EF4444';
      document.getElementById('p2').style.borderColor = p2OK ? '#10B981' : '#EF4444';
      document.getElementById('total').style.borderColor = totalOK ? '#10B981' : '#EF4444';

      if (p1OK && p2OK && totalOK) {
        correct++;
        feedback.innerHTML = `<span style="color:#10B981;">🎉 Perfect! ${q.num1} × ${q.num2} = ${q.answer}</span>`;
      } else {
        let hint = `<span style="color:var(--coral-pink);">Not quite!</span><br><span style="font-size:0.875rem;color:var(--gray-500);">${q.num1} × ${q.onesDigit2} = ${q.partial1} | ${q.num1} × ${q.tensDigit2}0 = ${q.partial2 * 10} | Total: ${q.answer}</span>`;
        feedback.innerHTML = hint;
      }

      setTimeout(renderQuestion, 2500);
    });
  }

  renderQuestion();
}

// ============================================================================
// LONG DIVISION PRACTICE — from Math Tank
// ============================================================================
function initLongDivision() {
  const area = document.getElementById('long-div-area');
  if (!area) return;

  let correct = 0, total = 0;

  function rand(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }

  function generate() {
    const divisor = rand(2, 5);
    const quotient = rand(11, 19);
    const remainder = rand(0, divisor - 1);
    const dividend = quotient * divisor + remainder;
    const tensDigit = Math.floor(quotient / 10);
    const onesDigit = quotient % 10;
    return { dividend, divisor, quotient, remainder, tensDigit, onesDigit };
  }

  function renderQuestion() {
    const q = generate();
    const dividendTens = Math.floor(q.dividend / 10);
    const step1product = q.tensDigit * q.divisor;
    const bringDown = (q.dividend - step1product * 10);

    area.innerHTML = `
      <div style="display:flex;justify-content:space-between;margin-bottom:1rem;font-size:0.875rem;color:var(--gray-400);">
        <span>Long Division</span>
        <span>✅ ${correct} / ${total}</span>
      </div>
      <div style="max-width:400px;margin:0 auto;font-family:var(--font-heading);">
        <!-- Division bracket display -->
        <div style="text-align:center;margin-bottom:1.5rem;">
          <div style="font-size:2rem;font-weight:800;color:var(--deep-navy);display:inline-flex;align-items:flex-start;gap:0.5rem;">
            <span style="font-size:1.25rem;color:var(--gray-500);align-self:center;">${q.divisor}</span>
            <span style="border-left:3px solid var(--deep-navy);border-top:3px solid var(--deep-navy);padding:0.25rem 1rem 0.25rem 0.75rem;letter-spacing:0.2em;">${q.dividend}</span>
          </div>
        </div>

        <!-- Step 1 -->
        <div style="background:var(--gray-50);border-radius:var(--radius-md);padding:1rem;margin-bottom:0.75rem;border:1px solid var(--gray-200);">
          <p style="font-size:0.875rem;color:var(--gray-500);margin-bottom:0.5rem;">🔹 First: ${q.divisor} goes into ${dividendTens} how many times?</p>
          <div style="display:flex;align-items:center;gap:0.5rem;justify-content:center;">
            <span style="color:var(--gray-500);">Tens digit of answer:</span>
            <input type="text" id="ld-tens" class="col-input" inputmode="numeric" maxlength="1" style="width:60px;padding:0.75rem;text-align:center;font-size:1.5rem;font-weight:700;border:2px solid var(--gray-200);border-radius:var(--radius-md);font-family:var(--font-heading);" placeholder="?" autocomplete="off" />
          </div>
        </div>

        <!-- Step 2 -->
        <div style="background:var(--gray-50);border-radius:var(--radius-md);padding:1rem;margin-bottom:0.75rem;border:1px solid var(--gray-200);">
          <p style="font-size:0.875rem;color:var(--gray-500);margin-bottom:0.5rem;">🔹 Next: ${q.divisor} goes into the remainder how many times?</p>
          <div style="display:flex;align-items:center;gap:0.5rem;justify-content:center;">
            <span style="color:var(--gray-500);">Ones digit of answer:</span>
            <input type="text" id="ld-ones" class="col-input" inputmode="numeric" maxlength="1" style="width:60px;padding:0.75rem;text-align:center;font-size:1.5rem;font-weight:700;border:2px solid var(--gray-200);border-radius:var(--radius-md);font-family:var(--font-heading);" placeholder="?" autocomplete="off" />
          </div>
        </div>

        <!-- Step 3: Remainder -->
        <div style="background:var(--gray-50);border-radius:var(--radius-md);padding:1rem;margin-bottom:1rem;border:1px solid var(--gray-200);">
          <p style="font-size:0.875rem;color:var(--gray-500);margin-bottom:0.5rem;">🔹 What's left over?</p>
          <div style="display:flex;align-items:center;gap:0.5rem;justify-content:center;">
            <span style="color:var(--gray-500);">Remainder:</span>
            <input type="text" id="ld-rem" class="col-input" inputmode="numeric" maxlength="1" style="width:60px;padding:0.75rem;text-align:center;font-size:1.5rem;font-weight:700;border:2px solid var(--ocean-teal);border-radius:var(--radius-md);font-family:var(--font-heading);" placeholder="?" autocomplete="off" />
          </div>
        </div>

        <div id="ld-feedback" style="text-align:center;min-height:60px;padding:0.5rem;font-family:var(--font-heading);font-weight:700;"></div>
        <div style="text-align:center;">
          <button class="btn btn-primary" id="ld-check">Check Answer ✓</button>
        </div>
      </div>
    `;

    document.getElementById('ld-tens').focus();

    // Auto-advance
    document.getElementById('ld-tens').addEventListener('input', function() {
      if (this.value.length >= 1) document.getElementById('ld-ones').focus();
    });
    document.getElementById('ld-ones').addEventListener('input', function() {
      if (this.value.length >= 1) document.getElementById('ld-rem').focus();
    });

    document.getElementById('ld-check').addEventListener('click', () => {
      const tens = parseInt(document.getElementById('ld-tens').value) || -1;
      const ones = parseInt(document.getElementById('ld-ones').value) || -1;
      const rem = parseInt(document.getElementById('ld-rem').value);
      if (isNaN(rem)) return;

      total++;
      const tensOK = tens === q.tensDigit;
      const onesOK = ones === q.onesDigit;
      const remOK = rem === q.remainder;

      document.getElementById('ld-tens').style.borderColor = tensOK ? '#10B981' : '#EF4444';
      document.getElementById('ld-ones').style.borderColor = onesOK ? '#10B981' : '#EF4444';
      document.getElementById('ld-rem').style.borderColor = remOK ? '#10B981' : '#EF4444';

      const feedback = document.getElementById('ld-feedback');
      if (tensOK && onesOK && remOK) {
        correct++;
        const remStr = q.remainder > 0 ? ` R${q.remainder}` : '';
        feedback.innerHTML = `<span style="color:#10B981;">🎉 Perfect! ${q.dividend} ÷ ${q.divisor} = ${q.quotient}${remStr}</span>`;
      } else {
        const remStr = q.remainder > 0 ? ` remainder ${q.remainder}` : ' no remainder';
        feedback.innerHTML = `<span style="color:var(--coral-pink);">The answer is ${q.quotient}${remStr}</span>`;
      }

      setTimeout(renderQuestion, 2500);
    });
  }

  renderQuestion();
}

// ============================================================================
// CLOCK MASTER — Time Race Demo (Auto-Start, Faithful to App)
// ============================================================================
function initTimeRaceGame() {
  const el = document.getElementById('time-race-game');
  if (!el) return;

  let score = 0, playerPos = 10, opponentPos = 10, round = 0;
  const totalRounds = 6;
  let currentQ = null, gameActive = false, answered = false;
  let countdown = 3, timer = 0, timerInterval = null, opponentInterval = null;
  const maxTimer = 15; // seconds per question

  function rand(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }

  function generateTimeQ() {
    const h = rand(1, 12);
    const m = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55][rand(0, 11)];
    const fmt = t => `${h}:${String(m).padStart(2, '0')}`;
    const correct = fmt();
    const hAngle = (h % 12) * 30 + m * 0.5;
    const mAngle = m * 6;

    const opts = new Set([correct]);
    while (opts.size < 4) {
      const wh = rand(1, 12);
      const wm = [0, 15, 30, 45][rand(0, 3)];
      const w = `${wh}:${String(wm).padStart(2, '0')}`;
      if (w !== correct) opts.add(w);
    }

    return { h, m, correct, options: [...opts].sort(() => Math.random() - 0.5), hAngle, mAngle };
  }

  function drawClock(q, size) {
    const r = size / 2 - 3;
    const cx = size / 2, cy = size / 2;
    let svg = `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">`;
    svg += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="white" stroke="#1E293B" stroke-width="2"/>`;
    for (let n = 1; n <= 12; n++) {
      const a = (n * 30 - 90) * Math.PI / 180;
      const tx = cx + (r - 8) * Math.cos(a);
      const ty = cy + (r - 8) * Math.sin(a);
      svg += `<text x="${tx}" y="${ty}" text-anchor="middle" dominant-baseline="central" font-size="${size/7}" font-weight="800" fill="#1E293B" font-family="var(--font-heading)">${n}</text>`;
    }
    // Minute hand
    const mx = cx + (r - 12) * Math.cos((q.mAngle - 90) * Math.PI / 180);
    const my = cy + (r - 12) * Math.sin((q.mAngle - 90) * Math.PI / 180);
    svg += `<line x1="${cx}" y1="${cy}" x2="${mx}" y2="${my}" stroke="#0D9488" stroke-width="2" stroke-linecap="round"/>`;
    // Hour hand
    const hx = cx + (r - 20) * Math.cos((q.hAngle - 90) * Math.PI / 180);
    const hy = cy + (r - 20) * Math.sin((q.hAngle - 90) * Math.PI / 180);
    svg += `<line x1="${cx}" y1="${cy}" x2="${hx}" y2="${hy}" stroke="#1E293B" stroke-width="3" stroke-linecap="round"/>`;
    svg += `<circle cx="${cx}" cy="${cy}" r="3" fill="#1E293B"/>`;
    svg += `</svg>`;
    return svg;
  }

  function renderRace() {
    const timerPct = (timer / maxTimer) * 100;
    const timerColor = timerPct > 50 ? '#22C55E' : timerPct > 25 ? '#FBBF24' : '#EF4444';

    el.innerHTML = `
      <div class="race-road">
        <div class="lane-line"></div>
        <!-- Road markings -->
        <div style="position:absolute;top:22%;left:0;right:0;height:2px;background:rgba(255,255,255,0.15);"></div>
        <div style="position:absolute;top:78%;left:0;right:0;height:2px;background:rgba(255,255,255,0.15);"></div>
        <!-- Finish line -->
        <div style="position:absolute;right:4%;top:15%;bottom:15%;width:4px;background:repeating-linear-gradient(180deg,#FFF 0,#FFF 8px,#000 8px,#000 16px);opacity:0.6;"></div>
        <!-- Player car -->
        <div style="position:absolute;left:${playerPos}%;top:62%;transform:translateY(-50%);font-size:2.5rem;filter:drop-shadow(0 4px 8px rgba(0,0,0,0.3));transition:left 0.6s cubic-bezier(0.34,1.56,0.64,1);">🏎️</div>
        <!-- Opponent car -->
        <div style="position:absolute;left:${opponentPos}%;top:38%;transform:translateY(-50%);font-size:2.2rem;filter:drop-shadow(0 4px 8px rgba(0,0,0,0.3));transition:left 0.6s ease;">🚗</div>
        ${showNitro ? '<div style="position:absolute;left:' + (playerPos - 3) + '%;top:62%;transform:translateY(-50%);font-size:1.5rem;animation:fadeOut 0.5s ease forwards;">🔥💨</div>' : ''}
        <!-- HUD -->
        <div style="position:absolute;top:8px;left:12px;right:12px;display:flex;justify-content:space-between;align-items:center;">
          <span style="font-size:0.75rem;color:rgba(255,255,255,0.8);font-weight:700;font-family:var(--font-heading);">Q ${round}/${totalRounds}</span>
          <span style="font-size:0.875rem;color:#FBBF24;font-weight:900;font-family:var(--font-heading);">⭐ ${score}</span>
        </div>
        <!-- Timer bar -->
        <div style="position:absolute;bottom:0;left:0;right:0;height:4px;background:rgba(0,0,0,0.2);">
          <div style="height:100%;width:${timerPct}%;background:${timerColor};transition:width 0.2s linear;"></div>
        </div>
        <!-- Clock question -->
        ${currentQ ? `
        <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);display:flex;align-items:center;gap:12px;background:rgba(0,0,0,0.8);backdrop-filter:blur(10px);padding:8px 20px;border-radius:50px;box-shadow:0 8px 32px rgba(0,0,0,0.3);">
          ${drawClock(currentQ, 56)}
          <span style="color:white;font-family:var(--font-heading);font-weight:800;font-size:1.1rem;">= ?</span>
        </div>
        ` : ''}
      </div>
      ${!answered && currentQ ? `
      <div class="race-options">${currentQ.options.map(o =>
        `<button class="race-option" data-ans="${o}">${o}</button>`
      ).join('')}</div>
      ` : ''}
    `;

    if (!answered && currentQ) {
      el.querySelectorAll('.race-option').forEach(btn => {
        btn.addEventListener('click', () => handleRaceAnswer(btn));
      });
    }
  }

  let showNitro = false;

  function handleRaceAnswer(btn) {
    if (answered) return;
    answered = true;
    clearInterval(timerInterval);
    const ans = btn.dataset.ans;
    const correct = ans === currentQ.correct;

    el.querySelectorAll('.race-option').forEach(b => {
      b.disabled = true;
      if (b.dataset.ans === currentQ.correct) b.classList.add('correct');
      if (b === btn && !correct) b.classList.add('wrong');
    });

    if (correct) {
      const bonus = Math.ceil(timer / maxTimer * 15);
      score += 10 + bonus;
      playerPos = Math.min(88, playerPos + rand(10, 14));
      showNitro = true;
    } else {
      opponentPos = Math.min(88, opponentPos + rand(6, 10));
    }

    renderRace();
    showNitro = false;
    round++;

    setTimeout(() => {
      if (round >= totalRounds || playerPos >= 85 || opponentPos >= 85) {
        endGame();
      } else {
        nextQuestion();
      }
    }, correct ? 800 : 1200);
  }

  function nextQuestion() {
    answered = false;
    currentQ = generateTimeQ();
    timer = maxTimer;
    renderRace();
    startTimer();
  }

  function startTimer() {
    clearInterval(timerInterval);
    timerInterval = setInterval(() => {
      timer -= 0.1;
      if (timer <= 0) {
        timer = 0;
        clearInterval(timerInterval);
        // Time up = wrong
        answered = true;
        opponentPos = Math.min(88, opponentPos + rand(4, 8));
        round++;
        renderRace();
        setTimeout(() => {
          if (round >= totalRounds || opponentPos >= 85) endGame();
          else nextQuestion();
        }, 800);
      } else {
        // Update timer bar only
        const bar = el.querySelector('[style*="transition:width 0.2s linear"]');
        if (bar) bar.style.width = (timer / maxTimer * 100) + '%';
        const barEl = bar;
        if (barEl) barEl.style.background = timer / maxTimer > 0.5 ? '#22C55E' : timer / maxTimer > 0.25 ? '#FBBF24' : '#EF4444';
      }
    }, 100);

    // Move opponent slowly
    clearInterval(opponentInterval);
    opponentInterval = setInterval(() => {
      if (gameActive) opponentPos = Math.min(88, opponentPos + 0.3);
    }, 300);
  }

  function endGame() {
    gameActive = false;
    clearInterval(timerInterval);
    clearInterval(opponentInterval);
    const won = playerPos > opponentPos;

    el.innerHTML = `
      <div style="text-align:center;padding:2.5rem 1.5rem;">
        <div style="font-size:4.5rem;margin-bottom:0.75rem;${won ? 'animation:iconBounce 1s ease infinite;' : ''}">${won ? '🏆' : '😅'}</div>
        <h3 style="font-size:1.75rem;margin-bottom:0.5rem;font-family:var(--font-heading);">${won ? 'You Won!' : 'So Close!'}</h3>
        <div style="display:inline-block;background:linear-gradient(135deg,rgba(13,148,136,0.1),rgba(167,139,250,0.1));border-radius:var(--radius-xl);padding:1rem 2rem;margin-bottom:1rem;">
          <span style="font-family:var(--font-heading);font-weight:900;font-size:2.5rem;color:var(--ocean-teal);">${score}</span>
          <span style="font-size:0.875rem;color:var(--gray-400);display:block;">points</span>
        </div>
        <p style="color:var(--gray-500);margin-bottom:1.5rem;font-size:0.9375rem;">The full app has <strong>8 clock lessons</strong>, <strong>car customization</strong>, <strong>30 space destinations</strong>, and <strong>4 difficulty modes!</strong></p>
        <div style="display:flex;gap:0.75rem;justify-content:center;flex-wrap:wrap;">
          <button class="btn btn-primary" onclick="document.getElementById('time-race-game')._restart()">Play Again 🏎️</button>
          <button class="btn btn-secondary" onclick="navigator.share?.({title:'I scored ${score} on Clock Master!',text:'Can you beat my score? Try the Time Race!',url:window.location.href}).catch(()=>{})">Share Score 📤</button>
        </div>
        <div style="margin-top:1.5rem;">
          <a href="#" class="store-badge" style="font-size:1rem;padding:1rem 2rem;">
            <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d="M3,20.5V3.5C3,2.91 3.34,2.39 3.84,2.15L13.69,12L3.84,21.85C3.34,21.61 3,21.09 3,20.5M16.81,15.12L6.05,21.34L14.54,12.85L16.81,15.12M20.16,10.81C20.5,11.08 20.75,11.5 20.75,12C20.75,12.5 20.5,12.92 20.16,13.19L17.89,14.5L15.39,12L17.89,9.5L20.16,10.81M6.05,2.66L16.81,8.88L14.54,11.15L6.05,2.66Z"/></svg>
            Get the Full Game
          </a>
        </div>
      </div>
    `;
    el._restart = startCountdown;
  }

  function startCountdown() {
    score = 0; playerPos = 10; opponentPos = 10; round = 0;
    answered = false; countdown = 3; gameActive = false;

    function tick() {
      if (countdown > 0) {
        el.innerHTML = `
          <div class="race-road">
            <div class="lane-line" style="animation-duration:999s;"></div>
            <div style="position:absolute;left:10%;top:62%;transform:translateY(-50%);font-size:2.5rem;">🏎️</div>
            <div style="position:absolute;left:10%;top:38%;transform:translateY(-50%);font-size:2.2rem;">🚗</div>
            <div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;">
              <div style="font-family:var(--font-heading);font-weight:900;font-size:6rem;color:white;text-shadow:0 4px 30px rgba(0,0,0,0.4);animation:fadeInUp 0.4s ease;">${countdown}</div>
            </div>
          </div>
        `;
        countdown--;
        setTimeout(tick, 800);
      } else {
        el.innerHTML = `
          <div class="race-road">
            <div class="lane-line" style="animation-duration:999s;"></div>
            <div style="position:absolute;left:10%;top:62%;transform:translateY(-50%);font-size:2.5rem;">🏎️</div>
            <div style="position:absolute;left:10%;top:38%;transform:translateY(-50%);font-size:2.2rem;">🚗</div>
            <div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;">
              <div style="font-family:var(--font-heading);font-weight:900;font-size:3.5rem;color:#4ADE80;text-shadow:0 4px 30px rgba(0,0,0,0.4);animation:fadeInUp 0.3s ease;">GO!</div>
            </div>
          </div>
        `;
        setTimeout(() => {
          gameActive = true;
          nextQuestion();
        }, 500);
      }
    }
    tick();
  }

  // Auto-start with intersection observer — game starts when scrolled into view
  const observer = new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting && !gameActive && countdown === 3) {
      observer.disconnect();
      setTimeout(startCountdown, 600);
    }
  }, { threshold: 0.5 });
  observer.observe(el);

  // Render initial attract state
  el.innerHTML = `
    <div class="race-road" style="cursor:pointer;" onclick="document.getElementById('time-race-game')._start()">
      <div class="lane-line"></div>
      <div style="position:absolute;left:10%;top:62%;transform:translateY(-50%);font-size:2.5rem;animation:otterFloat 2s ease-in-out infinite;">🏎️</div>
      <div style="position:absolute;left:55%;top:38%;transform:translateY(-50%);font-size:2.2rem;">🚗</div>
      <div style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;background:rgba(0,0,0,0.3);backdrop-filter:blur(2px);cursor:pointer;">
        <div style="font-size:3rem;margin-bottom:0.5rem;">🏁</div>
        <div style="font-family:var(--font-heading);font-weight:900;font-size:1.5rem;color:white;text-shadow:0 2px 10px rgba(0,0,0,0.3);">Tap to Race!</div>
        <div style="font-size:0.875rem;color:rgba(255,255,255,0.7);margin-top:0.25rem;">Read the clock • Pick the time • Beat your rival</div>
      </div>
    </div>
  `;
  el._start = startCountdown;
  el._restart = startCountdown;
}

// ============================================================================
// MATH TANK — Tank Battle Demo (Auto-Start, Faithful to App)
// ============================================================================
function initMathBattleGame() {
  const el = document.getElementById('math-battle-game');
  if (!el) return;

  let score = 0, playerHp = 100, enemyHp = 100, round = 0;
  const totalRounds = 8;
  let currentQ = null, gameActive = false, answered = false;
  let countdown = 3, timer = 0, timerInterval = null;
  const maxTimer = 10;
  const missiles = ['⚡','❄️','🔥','💣','☀️','🌀','👻','🚀','💫','☢️'];
  const missileNames = ['Laser Beam','Ice Shard','Lightning Bolt','Bomb Cluster','Solar Flare','Gravity Orb','Phantom Shot','Rocket Swarm','Plasma Core','Atomic Core'];

  function rand(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }

  function generateMathQ() {
    const a = rand(2, 10), b = rand(2, 10);
    const answer = a * b;
    const opts = new Set([answer]);
    while (opts.size < 4) {
      let w = answer + rand(-8, 8);
      if (w > 0 && w !== answer) opts.add(w);
    }
    return { prompt: `${a} × ${b}`, answer, options: [...opts].sort(() => Math.random() - 0.5) };
  }

  function renderBattle() {
    const timerPct = (timer / maxTimer) * 100;
    const timerColor = timerPct > 50 ? '#22C55E' : timerPct > 25 ? '#FBBF24' : '#EF4444';
    const mi = rand(0, missiles.length - 1);

    el.innerHTML = `
      <div class="battle-arena">
        <div class="stars"></div>
        <!-- Player tank -->
        <div style="position:absolute;left:12%;top:55%;transform:translateY(-50%);font-size:2.8rem;filter:drop-shadow(0 4px 12px rgba(0,0,0,0.4));">🛡️</div>
        <!-- Enemy pirate tank -->
        <div style="position:absolute;right:12%;top:45%;transform:translateY(-50%) scaleX(-1);font-size:2.8rem;filter:drop-shadow(0 4px 12px rgba(0,0,0,0.4));">🏴‍☠️</div>
        <!-- HP Bars -->
        <div style="position:absolute;bottom:10px;left:8%;text-align:center;">
          <div style="font-size:0.65rem;color:rgba(255,255,255,0.6);font-weight:700;margin-bottom:2px;">YOUR TANK</div>
          <div style="width:90px;height:8px;background:rgba(255,255,255,0.12);border-radius:4px;overflow:hidden;">
            <div style="height:100%;width:${playerHp}%;background:linear-gradient(90deg,#22C55E,#4ADE80);border-radius:4px;transition:width 0.4s ease;"></div>
          </div>
        </div>
        <div style="position:absolute;bottom:10px;right:8%;text-align:center;">
          <div style="font-size:0.65rem;color:rgba(255,255,255,0.6);font-weight:700;margin-bottom:2px;">PIRATE</div>
          <div style="width:90px;height:8px;background:rgba(255,255,255,0.12);border-radius:4px;overflow:hidden;">
            <div style="height:100%;width:${enemyHp}%;background:linear-gradient(90deg,#EF4444,#F87171);border-radius:4px;transition:width 0.4s ease;"></div>
          </div>
        </div>
        <!-- HUD -->
        <div style="position:absolute;top:8px;left:12px;right:12px;display:flex;justify-content:space-between;">
          <span style="font-size:0.75rem;color:rgba(255,255,255,0.7);font-weight:700;">Round ${round}/${totalRounds}</span>
          <span style="font-size:0.875rem;color:#FBBF24;font-weight:900;">⭐ ${score}</span>
        </div>
        <!-- Question -->
        ${currentQ && !answered ? `
        <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);background:rgba(255,255,255,0.95);backdrop-filter:blur(10px);padding:10px 28px;border-radius:var(--radius-xl);box-shadow:0 8px 32px rgba(0,0,0,0.3);z-index:10;">
          <span style="font-family:var(--font-heading);font-weight:900;font-size:1.75rem;color:var(--deep-navy);">${currentQ.prompt} = ?</span>
        </div>
        ` : ''}
        <!-- Timer -->
        <div style="position:absolute;bottom:0;left:0;right:0;height:4px;background:rgba(255,255,255,0.1);">
          <div id="battle-timer-bar" style="height:100%;width:${timerPct}%;background:${timerColor};transition:width 0.2s linear;"></div>
        </div>
      </div>
      ${!answered && currentQ ? `
      <div class="race-options">${currentQ.options.map(o =>
        `<button class="race-option" data-val="${o}">${o}</button>`
      ).join('')}</div>
      ` : ''}
    `;

    if (!answered && currentQ) {
      el.querySelectorAll('.race-option').forEach(btn => {
        btn.addEventListener('click', () => handleBattleAnswer(btn, mi));
      });
    }
  }

  function fireMissile(fromPlayer, emoji) {
    const arena = el.querySelector('.battle-arena');
    if (!arena) return;
    const m = document.createElement('div');
    m.style.cssText = 'position:absolute;font-size:1.8rem;top:50%;transform:translateY(-50%);z-index:5;';
    m.textContent = emoji;
    if (fromPlayer) {
      m.style.left = '20%';
      m.style.transition = 'left 0.5s ease-in';
      arena.appendChild(m);
      requestAnimationFrame(() => { m.style.left = '78%'; });
    } else {
      m.style.right = '20%';
      m.style.transition = 'right 0.5s ease-in';
      arena.appendChild(m);
      requestAnimationFrame(() => { m.style.right = '78%'; });
    }
    setTimeout(() => {
      m.textContent = '💥';
      m.style.fontSize = '2.5rem';
      setTimeout(() => m.remove(), 300);
    }, 500);
  }

  function handleBattleAnswer(btn, mi) {
    if (answered) return;
    answered = true;
    clearInterval(timerInterval);
    const val = parseInt(btn.dataset.val);
    const correct = val === currentQ.answer;

    el.querySelectorAll('.race-option').forEach(b => {
      b.disabled = true;
      if (parseInt(b.dataset.val) === currentQ.answer) b.classList.add('correct');
      if (b === btn && !correct) b.classList.add('wrong');
    });

    if (correct) {
      const speedBonus = Math.ceil(timer / maxTimer * 10);
      const power = timer / maxTimer >= 0.9 ? 'IV' : timer / maxTimer >= 0.7 ? 'III' : timer / maxTimer >= 0.4 ? 'II' : 'I';
      score += 10 + speedBonus;
      enemyHp = Math.max(0, enemyHp - rand(12, 20));
      fireMissile(true, missiles[mi]);
    } else {
      playerHp = Math.max(0, playerHp - rand(10, 16));
      setTimeout(() => fireMissile(false, '💀'), 400);
    }

    round++;
    setTimeout(() => {
      if (round >= totalRounds || playerHp <= 0 || enemyHp <= 0) endBattle();
      else nextBattleQ();
    }, correct ? 1000 : 1400);
  }

  function nextBattleQ() {
    answered = false;
    currentQ = generateMathQ();
    timer = maxTimer;
    renderBattle();
    startBattleTimer();
  }

  function startBattleTimer() {
    clearInterval(timerInterval);
    timerInterval = setInterval(() => {
      timer -= 0.1;
      if (timer <= 0) {
        timer = 0;
        clearInterval(timerInterval);
        answered = true;
        playerHp = Math.max(0, playerHp - rand(8, 14));
        setTimeout(() => fireMissile(false, '💀'), 200);
        round++;
        renderBattle();
        setTimeout(() => {
          if (round >= totalRounds || playerHp <= 0) endBattle();
          else nextBattleQ();
        }, 1200);
      } else {
        const bar = document.getElementById('battle-timer-bar');
        if (bar) {
          bar.style.width = (timer / maxTimer * 100) + '%';
          bar.style.background = timer / maxTimer > 0.5 ? '#22C55E' : timer / maxTimer > 0.25 ? '#FBBF24' : '#EF4444';
        }
      }
    }, 100);
  }

  function endBattle() {
    gameActive = false;
    clearInterval(timerInterval);
    const won = enemyHp <= 0 || playerHp > enemyHp;

    el.innerHTML = `
      <div style="text-align:center;padding:2.5rem 1.5rem;">
        <div style="font-size:4.5rem;margin-bottom:0.75rem;${won ? 'animation:iconBounce 1s ease infinite;' : ''}">${won ? '🏆' : '💪'}</div>
        <h3 style="font-size:1.75rem;margin-bottom:0.5rem;font-family:var(--font-heading);">${won ? 'Pirate Defeated!' : 'Good Fight!'}</h3>
        <div style="display:inline-block;background:linear-gradient(135deg,rgba(167,139,250,0.1),rgba(251,113,133,0.1));border-radius:var(--radius-xl);padding:1rem 2rem;margin-bottom:1rem;">
          <span style="font-family:var(--font-heading);font-weight:900;font-size:2.5rem;color:var(--lavender);">${score}</span>
          <span style="font-size:0.875rem;color:var(--gray-400);display:block;">points</span>
        </div>
        <p style="color:var(--gray-500);margin-bottom:1.5rem;font-size:0.9375rem;">The full game has <strong>10 tanks</strong>, <strong>10 missiles with special effects</strong>, <strong>90 space levels</strong>, and <strong>animated lessons!</strong></p>
        <div style="display:flex;gap:0.75rem;justify-content:center;flex-wrap:wrap;">
          <button class="btn btn-primary" onclick="document.getElementById('math-battle-game')._restart()">Battle Again ⚔️</button>
          <button class="btn btn-secondary" onclick="navigator.share?.({title:'I scored ${score} in Math Tank!',text:'Can you beat my score? Try the Tank Battle!',url:window.location.href}).catch(()=>{})">Share Score 📤</button>
        </div>
        <div style="margin-top:1.5rem;">
          <a href="#" class="store-badge" style="font-size:1rem;padding:1rem 2rem;">
            <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d="M3,20.5V3.5C3,2.91 3.34,2.39 3.84,2.15L13.69,12L3.84,21.85C3.34,21.61 3,21.09 3,20.5M16.81,15.12L6.05,21.34L14.54,12.85L16.81,15.12M20.16,10.81C20.5,11.08 20.75,11.5 20.75,12C20.75,12.5 20.5,12.92 20.16,13.19L17.89,14.5L15.39,12L17.89,9.5L20.16,10.81M6.05,2.66L16.81,8.88L14.54,11.15L6.05,2.66Z"/></svg>
            Get the Full Game
          </a>
        </div>
      </div>
    `;
    el._restart = startBattleCountdown;
  }

  function startBattleCountdown() {
    score = 0; playerHp = 100; enemyHp = 100; round = 0;
    answered = false; countdown = 3; gameActive = false;

    function tick() {
      if (countdown > 0) {
        el.innerHTML = `
          <div class="battle-arena">
            <div class="stars"></div>
            <div style="position:absolute;left:12%;top:55%;transform:translateY(-50%);font-size:2.8rem;">🛡️</div>
            <div style="position:absolute;right:12%;top:45%;transform:translateY(-50%) scaleX(-1);font-size:2.8rem;">🏴‍☠️</div>
            <div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;">
              <div style="font-family:var(--font-heading);font-weight:900;font-size:6rem;color:white;text-shadow:0 4px 30px rgba(0,0,0,0.5);animation:fadeInUp 0.4s ease;">${countdown}</div>
            </div>
          </div>
        `;
        countdown--;
        setTimeout(tick, 800);
      } else {
        el.innerHTML = `
          <div class="battle-arena">
            <div class="stars"></div>
            <div style="position:absolute;left:12%;top:55%;transform:translateY(-50%);font-size:2.8rem;">🛡️</div>
            <div style="position:absolute;right:12%;top:45%;transform:translateY(-50%) scaleX(-1);font-size:2.8rem;">🏴‍☠️</div>
            <div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;">
              <div style="font-family:var(--font-heading);font-weight:900;font-size:3rem;color:#EF4444;text-shadow:0 4px 30px rgba(0,0,0,0.5);animation:fadeInUp 0.3s ease;">FIGHT!</div>
            </div>
          </div>
        `;
        setTimeout(() => {
          gameActive = true;
          nextBattleQ();
        }, 500);
      }
    }
    tick();
  }

  // Auto-start with intersection observer
  const observer = new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting && !gameActive && countdown === 3) {
      observer.disconnect();
      setTimeout(startBattleCountdown, 600);
    }
  }, { threshold: 0.5 });
  observer.observe(el);

  // Attract state
  el.innerHTML = `
    <div class="battle-arena" style="cursor:pointer;" onclick="document.getElementById('math-battle-game')._start()">
      <div class="stars"></div>
      <div style="position:absolute;left:12%;top:55%;transform:translateY(-50%);font-size:2.8rem;animation:otterFloat 2s ease-in-out infinite;">🛡️</div>
      <div style="position:absolute;right:12%;top:45%;transform:translateY(-50%) scaleX(-1);font-size:2.8rem;animation:otterFloat 2s ease-in-out infinite;animation-delay:-1s;">🏴‍☠️</div>
      <div style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;background:rgba(0,0,0,0.4);backdrop-filter:blur(2px);cursor:pointer;">
        <div style="font-size:3rem;margin-bottom:0.5rem;">⚔️</div>
        <div style="font-family:var(--font-heading);font-weight:900;font-size:1.5rem;color:white;text-shadow:0 2px 10px rgba(0,0,0,0.3);">Tap to Battle!</div>
        <div style="font-size:0.875rem;color:rgba(255,255,255,0.7);margin-top:0.25rem;">Solve math • Fire missiles • Defeat pirates</div>
      </div>
    </div>
  `;
  el._start = startBattleCountdown;
  el._restart = startBattleCountdown;
}

// ============================================================================
// INIT ON PAGE LOAD
// ============================================================================
document.addEventListener('DOMContentLoaded', () => {
  initMultiplicationTable();
  initMathQuiz();
  initSpellingBee();
  initCalculator();
  initMultiplicationPractice();
  initDivisionPractice();
  initColumnMultiplication();
  initLongDivision();
  // Pro game demos are initialized in games-pro.js if available
  // Only use legacy demos as fallback
  if (typeof initTimeRaceGamePro === 'undefined') {
    initTimeRaceGame();
  }
  if (typeof initMathBattleGamePro === 'undefined') {
    initMathBattleGame();
  }
});
