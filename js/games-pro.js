/* ============================================================================
   OTTERLY GAMES — HIGH-FIDELITY GAME DEMOS
   Faithful recreations of Clock Master & Math Tank for web preview
   ============================================================================ */

// ============================================================================
// CLOCK MASTER - TIME RACE GAME
// Authentic recreation with car racing, difficulty-based questions, and real UI
// ============================================================================

function initTimeRaceGamePro() {
  const el = document.getElementById('time-race-game');
  if (!el) return;

  // Game state
  let score = 0, playerPos = 8, opponentPos = 8, questionNum = 0;
  const totalQuestions = 7;
  let currentQ = null, gameActive = false, answered = false;
  let timer = 0, timerInterval = null, opponentInterval = null;
  let difficulty = 'easy';
  let recentTimes = [];
  let showNitro = false;
  let carColor = 'blue';

  // Difficulty settings (matching actual game)
  const difficultySettings = {
    easy: { timerSeconds: 20, opponentSpeed: 1.2, label: 'Easy', desc: 'Full hours' },
    medium: { timerSeconds: 15, opponentSpeed: 1.6, label: 'Medium', desc: 'Quarter hours' },
    hard: { timerSeconds: 12, opponentSpeed: 2.2, label: 'Hard', desc: '5-min intervals' }
  };

  // Car colors (matching actual game)
  const carColors = {
    blue: { primary: '#3B82F6', secondary: '#60A5FA', accent: '#93C5FD' },
    red: { primary: '#EF4444', secondary: '#F87171', accent: '#FCA5A5' },
    green: { primary: '#10B981', secondary: '#34D399', accent: '#6EE7B7' },
    purple: { primary: '#8B5CF6', secondary: '#A78BFA', accent: '#C4B5FD' },
    yellow: { primary: '#F59E0B', secondary: '#FBBF24', accent: '#FCD34D' },
    pink: { primary: '#EC4899', secondary: '#F472B6', accent: '#F9A8D4' }
  };

  function rand(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }

  // Generate time based on difficulty (matching actual game logic)
  function generateTimeQuestion() {
    let times;
    
    if (difficulty === 'easy') {
      // Full hours only (1:00 through 12:00)
      times = [];
      for (let h = 1; h <= 12; h++) {
        times.push({ hours: h, minutes: 0 });
      }
    } else if (difficulty === 'medium') {
      // Quarter hours (0, 15, 30, 45 minutes)
      times = [];
      for (let h = 1; h <= 12; h++) {
        for (const m of [0, 15, 30, 45]) {
          times.push({ hours: h, minutes: m });
        }
      }
    } else {
      // Hard: 5-minute intervals
      times = [];
      for (let h = 1; h <= 12; h++) {
        for (let m = 0; m < 60; m += 5) {
          times.push({ hours: h, minutes: m });
        }
      }
    }

    // Filter recently used times
    const availableTimes = times.filter(t => {
      const key = `${t.hours}:${t.minutes}`;
      return !recentTimes.includes(key);
    });
    
    const timesToUse = availableTimes.length > 3 ? availableTimes : times;
    const chosen = timesToUse[rand(0, timesToUse.length - 1)];
    
    // Track to avoid repetition
    const key = `${chosen.hours}:${chosen.minutes}`;
    recentTimes.push(key);
    if (recentTimes.length > 8) recentTimes.shift();
    
    // Calculate hand angles
    const hAngle = (chosen.hours % 12) * 30 + chosen.minutes * 0.5;
    const mAngle = chosen.minutes * 6;
    
    // Generate correct answer
    const correct = `${chosen.hours}:${String(chosen.minutes).padStart(2, '0')}`;
    
    // Generate wrong options based on difficulty
    const options = new Set([correct]);
    
    if (difficulty === 'easy') {
      // Nearby hours
      const nearbyHours = [chosen.hours - 2, chosen.hours - 1, chosen.hours + 1, chosen.hours + 2]
        .map(h => h <= 0 ? h + 12 : h > 12 ? h - 12 : h);
      for (const h of nearbyHours) {
        if (options.size < 4) options.add(`${h}:00`);
      }
    } else if (difficulty === 'medium') {
      // Same hour with different quarter
      for (const m of [0, 15, 30, 45]) {
        const opt = `${chosen.hours}:${String(m).padStart(2, '0')}`;
        if (opt !== correct && options.size < 4) options.add(opt);
      }
      // Adjacent hours if needed
      if (options.size < 4) {
        const adjHour = chosen.hours === 12 ? 1 : chosen.hours + 1;
        options.add(`${adjHour}:${String(chosen.minutes).padStart(2, '0')}`);
      }
    } else {
      // 5-minute differences
      const offsets = [-15, -10, -5, 5, 10, 15].sort(() => Math.random() - 0.5);
      for (const offset of offsets) {
        if (options.size >= 4) break;
        let newM = chosen.minutes + offset;
        let newH = chosen.hours;
        if (newM < 0) { newM += 60; newH = newH === 1 ? 12 : newH - 1; }
        if (newM >= 60) { newM -= 60; newH = newH === 12 ? 1 : newH + 1; }
        const opt = `${newH}:${String(newM).padStart(2, '0')}`;
        if (opt !== correct) options.add(opt);
      }
    }
    
    // Fill remaining
    while (options.size < 4) {
      const rh = rand(1, 12);
      const rm = difficulty === 'easy' ? 0 : difficulty === 'medium' ? [0, 15, 30, 45][rand(0, 3)] : rand(0, 11) * 5;
      const opt = `${rh}:${String(rm).padStart(2, '0')}`;
      if (opt !== correct) options.add(opt);
    }
    
    return {
      hours: chosen.hours,
      minutes: chosen.minutes,
      hAngle,
      mAngle,
      correct,
      options: [...options].sort(() => Math.random() - 0.5)
    };
  }

  // Draw car SVG (matching actual CarDesign.tsx)
  function drawCar(color, className = '', isOpponent = false) {
    const c = carColors[color] || carColors.blue;
    if (isOpponent) {
      // Opponent car - simpler design
      return `
        <svg class="${className}" viewBox="0 0 80 40" xmlns="http://www.w3.org/2000/svg">
          <rect x="10" y="15" width="60" height="16" fill="#64748B" stroke="#334155" stroke-width="1" rx="3"/>
          <path d="M 22 15 L 28 8 L 52 8 L 58 15 Z" fill="#64748B" stroke="#334155" stroke-width="1"/>
          <rect x="30" y="9" width="20" height="8" fill="#7DD3FC" opacity="0.5" rx="1"/>
          <circle cx="22" cy="31" r="6" fill="#1F2937"/>
          <circle cx="22" cy="31" r="3" fill="#6B7280"/>
          <circle cx="58" cy="31" r="6" fill="#1F2937"/>
          <circle cx="58" cy="31" r="3" fill="#6B7280"/>
        </svg>
      `;
    }
    // Player car - sporty design (speedster type)
    return `
      <svg class="${className}" viewBox="0 0 100 50" xmlns="http://www.w3.org/2000/svg">
        <ellipse cx="50" cy="44" rx="40" ry="4" fill="black" opacity="0.15"/>
        <path d="M 15 30 L 30 22 L 45 18 L 70 18 L 85 22 L 95 30 L 90 38 L 18 38 Z" 
              fill="${c.primary}" stroke="#1F2937" stroke-width="1.5"/>
        <path d="M 35 22 L 45 19 L 65 19 L 75 22 L 68 28 L 42 28 Z" 
              fill="#7DD3FC" opacity="0.6" stroke="#1F2937" stroke-width="1"/>
        <path d="M 28 30 L 88 30 L 86 36 L 30 36 Z" fill="${c.secondary}" opacity="0.7"/>
        <rect x="85" y="22" width="10" height="2" fill="#1F2937" rx="1"/>
        <circle cx="32" cy="38" r="7" fill="#1F2937" stroke="#374151" stroke-width="1.5"/>
        <circle cx="32" cy="38" r="4" fill="#6B7280"/>
        <circle cx="32" cy="38" r="2" fill="${c.accent}"/>
        <circle cx="75" cy="38" r="7" fill="#1F2937" stroke="#374151" stroke-width="1.5"/>
        <circle cx="75" cy="38" r="4" fill="#6B7280"/>
        <circle cx="75" cy="38" r="2" fill="${c.accent}"/>
        <circle cx="10" cy="30" r="2" fill="#FEF08A"/>
        <circle cx="96" cy="29" r="1.5" fill="#FCA5A5"/>
        ${showNitro ? `<ellipse cx="5" cy="30" rx="6" ry="3" fill="#FF6B00" opacity="0.8"><animate attributeName="opacity" values="0.8;0.3;0.8" dur="0.2s" repeatCount="indefinite"/></ellipse>` : ''}
      </svg>
    `;
  }

  // Draw analog clock (matching actual game clock)
  function drawClock(q, size = 100) {
    const r = size / 2 - 4;
    const cx = size / 2, cy = size / 2;
    
    // Hour hand angle (90 offset because 12 is at top)
    const hourAngle = (q.hAngle - 90) * Math.PI / 180;
    const hx = cx + (r * 0.5) * Math.cos(hourAngle);
    const hy = cy + (r * 0.5) * Math.sin(hourAngle);
    
    // Minute hand angle
    const minuteAngle = (q.mAngle - 90) * Math.PI / 180;
    const mx = cx + (r * 0.75) * Math.cos(minuteAngle);
    const my = cy + (r * 0.75) * Math.sin(minuteAngle);
    
    let svg = `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">`;
    // Clock face
    svg += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="white" stroke="#1E293B" stroke-width="3"/>`;
    
    // Hour markers
    for (let n = 1; n <= 12; n++) {
      const a = (n * 30 - 90) * Math.PI / 180;
      const tx = cx + (r - 12) * Math.cos(a);
      const ty = cy + (r - 12) * Math.sin(a) + 4;
      svg += `<text x="${tx}" y="${ty}" text-anchor="middle" font-size="${size/7}" font-weight="800" fill="#1E293B" font-family="Nunito, sans-serif">${n}</text>`;
    }
    
    // Minute hand (teal, longer)
    svg += `<line x1="${cx}" y1="${cy}" x2="${mx}" y2="${my}" stroke="#0D9488" stroke-width="3" stroke-linecap="round"/>`;
    // Hour hand (dark, shorter, thicker)
    svg += `<line x1="${cx}" y1="${cy}" x2="${hx}" y2="${hy}" stroke="#1E293B" stroke-width="4" stroke-linecap="round"/>`;
    // Center dot
    svg += `<circle cx="${cx}" cy="${cy}" r="4" fill="#1E293B"/>`;
    svg += `</svg>`;
    return svg;
  }

  // Render menu screen
  function renderMenu() {
    el.innerHTML = `
      <div class="race-menu">
        <div class="race-menu-header">
          <div class="race-menu-icon">🏎️</div>
          <h3>Time Race</h3>
          <p>Answer clock questions to boost your speed!</p>
        </div>
        
        <div class="race-menu-section">
          <div class="race-menu-label">Select Difficulty</div>
          <div class="race-difficulty-grid">
            ${Object.entries(difficultySettings).map(([key, val]) => `
              <button class="race-diff-btn ${difficulty === key ? 'active' : ''}" data-diff="${key}">
                <span class="race-diff-name">${val.label}</span>
                <span class="race-diff-desc">${val.desc}</span>
              </button>
            `).join('')}
          </div>
        </div>
        
        <div class="race-menu-section">
          <div class="race-menu-label">Your Car</div>
          <div class="race-car-preview">
            ${drawCar(carColor, 'race-preview-car')}
          </div>
          <div class="race-color-grid">
            ${Object.keys(carColors).map(c => `
              <button class="race-color-btn ${carColor === c ? 'active' : ''}" data-color="${c}" style="background: ${carColors[c].primary}"></button>
            `).join('')}
          </div>
        </div>
        
        <button class="race-start-btn">
          <span>🏁 Start Race!</span>
        </button>
      </div>
    `;
    
    // Event listeners
    el.querySelectorAll('.race-diff-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        difficulty = btn.dataset.diff;
        renderMenu();
      });
    });
    
    el.querySelectorAll('.race-color-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        carColor = btn.dataset.color;
        renderMenu();
      });
    });
    
    el.querySelector('.race-start-btn').addEventListener('click', startCountdown);
  }

  // Start countdown
  function startCountdown() {
    let count = 3;
    
    function showCount() {
      el.innerHTML = `
        <div class="race-countdown">
          <div class="race-countdown-num">${count === 0 ? '🏁 GO!' : count}</div>
        </div>
      `;
      
      if (count > 0) {
        count--;
        setTimeout(showCount, 800);
      } else {
        setTimeout(startGame, 500);
      }
    }
    
    showCount();
  }

  // Start game
  function startGame() {
    gameActive = true;
    score = 0;
    playerPos = 8;
    opponentPos = 8;
    questionNum = 0;
    recentTimes = [];
    nextQuestion();
    
    // Start opponent movement
    const settings = difficultySettings[difficulty];
    opponentInterval = setInterval(() => {
      if (!gameActive) return;
      opponentPos = Math.min(92, opponentPos + Math.random() * settings.opponentSpeed * 0.4);
      renderRace();
      
      if (opponentPos >= 92) {
        endGame(false);
      }
    }, 500);
  }

  // Next question
  function nextQuestion() {
    if (questionNum >= totalQuestions || playerPos >= 92) {
      endGame(true);
      return;
    }
    
    questionNum++;
    answered = false;
    showNitro = false;
    currentQ = generateTimeQuestion();
    
    const settings = difficultySettings[difficulty];
    timer = settings.timerSeconds;
    
    // Start timer
    if (timerInterval) clearInterval(timerInterval);
    timerInterval = setInterval(() => {
      timer -= 0.1;
      if (timer <= 0) {
        handleTimeout();
      } else {
        renderRace();
      }
    }, 100);
    
    renderRace();
  }

  // Handle timeout
  function handleTimeout() {
    if (answered) return;
    answered = true;
    clearInterval(timerInterval);
    
    // Opponent gains on timeout
    opponentPos = Math.min(92, opponentPos + rand(8, 12));
    
    setTimeout(nextQuestion, 1200);
    renderRace();
  }

  // Handle answer
  function handleAnswer(answer) {
    if (answered || !gameActive) return;
    answered = true;
    clearInterval(timerInterval);
    
    const isCorrect = answer === currentQ.correct;
    
    if (isCorrect) {
      const bonus = Math.ceil(timer / difficultySettings[difficulty].timerSeconds * 15);
      score += 10 + bonus;
      playerPos = Math.min(92, playerPos + rand(10, 14));
      showNitro = true;
    } else {
      opponentPos = Math.min(92, opponentPos + rand(6, 10));
    }
    
    renderRace();
    
    // Mark correct/wrong on buttons
    el.querySelectorAll('.race-option').forEach(btn => {
      btn.disabled = true;
      if (btn.dataset.ans === currentQ.correct) btn.classList.add('correct');
      if (btn.dataset.ans === answer && !isCorrect) btn.classList.add('wrong');
    });
    
    setTimeout(() => {
      showNitro = false;
      if (playerPos >= 92) {
        endGame(true);
      } else {
        nextQuestion();
      }
    }, 1000);
  }

  // End game
  function endGame(won) {
    gameActive = false;
    showNitro = false;
    clearInterval(timerInterval);
    clearInterval(opponentInterval);
    
    const finalScore = score + (won ? 50 : 0);
    
    el.innerHTML = `
      <div class="race-result ${won ? 'won' : 'lost'}">
        <div class="race-result-icon">${won ? '🏆' : '😢'}</div>
        <h3>${won ? 'You Won!' : 'Race Lost'}</h3>
        <p>${won ? 'Great job reading the clock!' : 'The opponent crossed first!'}</p>
        
        <div class="race-result-stats">
          <div class="race-stat">
            <span class="race-stat-value">${finalScore}</span>
            <span class="race-stat-label">Score</span>
          </div>
          <div class="race-stat">
            <span class="race-stat-value">${questionNum}</span>
            <span class="race-stat-label">Questions</span>
          </div>
        </div>
        
        <div class="race-result-cta">
          <button class="race-play-again-btn">🏎️ Race Again</button>
          <a href="#download" class="race-download-btn">📲 Get Full Game</a>
        </div>
      </div>
    `;
    
    el.querySelector('.race-play-again-btn').addEventListener('click', renderMenu);
  }

  // Render race view
  function renderRace() {
    const settings = difficultySettings[difficulty];
    const timerPct = Math.max(0, (timer / settings.timerSeconds) * 100);
    const timerColor = timerPct > 66 ? '#22C55E' : timerPct > 33 ? '#FBBF24' : '#EF4444';
    
    el.innerHTML = `
      <div class="race-track">
        <!-- Road background -->
        <div class="race-road">
          <div class="race-lane lane-1"></div>
          <div class="race-lane-divider"></div>
          <div class="race-lane lane-2"></div>
          <div class="race-finish"></div>
          
          <!-- Opponent car (top lane) -->
          <div class="race-car opponent-car" style="left: ${opponentPos}%">
            ${drawCar('blue', '', true)}
          </div>
          
          <!-- Player car (bottom lane) -->
          <div class="race-car player-car" style="left: ${playerPos}%">
            ${drawCar(carColor, '')}
          </div>
        </div>
        
        <!-- HUD -->
        <div class="race-hud">
          <div class="race-hud-left">
            <span class="race-q-num">Q ${questionNum}/${totalQuestions}</span>
          </div>
          <div class="race-hud-center">
            <span class="race-score">⭐ ${score}</span>
          </div>
          <div class="race-hud-right">
            <span class="race-diff-badge">${settings.label}</span>
          </div>
        </div>
        
        <!-- Timer bar -->
        <div class="race-timer-bar">
          <div class="race-timer-fill" style="width: ${timerPct}%; background: ${timerColor}"></div>
        </div>
      </div>
      
      <!-- Question area -->
      <div class="race-question-area">
        <div class="race-clock-container">
          ${drawClock(currentQ, 140)}
          <div class="race-clock-label">What time is it?</div>
        </div>
        
        <div class="race-options-grid">
          ${currentQ.options.map(opt => `
            <button class="race-option" data-ans="${opt}">${opt}</button>
          `).join('')}
        </div>
      </div>
    `;
    
    // Add click handlers
    el.querySelectorAll('.race-option').forEach(btn => {
      btn.addEventListener('click', () => handleAnswer(btn.dataset.ans));
    });
  }

  // Initialize
  renderMenu();
  el._restart = renderMenu;
  el._start = startCountdown;
}

// ============================================================================
// MATH TANK - BATTLE GAME
// Authentic recreation with tank battles, HP system, and attack/defense phases
// ============================================================================

function initMathBattleGamePro() {
  const el = document.getElementById('math-battle-game');
  if (!el) return;

  // Game state
  let playerHP = 100, enemyHP = 100;
  let playerMaxHP = 100, enemyMaxHP = 100;
  let phase = 'attack'; // 'attack' or 'defend'
  let turnNum = 0, score = 0;
  let currentQ = null, answered = false;
  let timer = 0, timerInterval = null;
  let difficulty = 'easy';
  let userAnswer = '';
  let gameActive = false;
  let battleTableNumber = null; // For hard/god modes

  // Difficulty settings (matching actual game)
  const difficultySettings = {
    easy: { timerSeconds: 8, label: 'Easy', desc: 'Tables 1-5', maxTable: 5 },
    medium: { timerSeconds: 7, label: 'Medium', desc: 'Tables 1-10', maxTable: 10 },
    hard: { timerSeconds: 6, label: 'Hard', desc: 'Single table', maxTable: 12 }
  };

  // Tank designs (simplified versions of actual tanks)
  const tankDesigns = {
    pebble: { name: 'Scout', color: '#00E676', emoji: '🛸' },
    steel: { name: 'Steel', color: '#607D8B', emoji: '🤖' },
    spark: { name: 'Spark', color: '#FFEB3B', emoji: '⚡' },
    venom: { name: 'Venom', color: '#76FF03', emoji: '🐍' },
    inferno: { name: 'Inferno', color: '#FF5722', emoji: '🔥' }
  };
  
  let playerTank = 'pebble';
  let enemyTank = 'inferno';

  function rand(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }

  // Generate math question (matching actual game logic)
  function generateQuestion() {
    const settings = difficultySettings[difficulty];
    let a, b, answer;
    
    if (difficulty === 'hard' && battleTableNumber) {
      // Hard mode: use the set table number
      a = battleTableNumber;
      b = rand(1, 12);
    } else {
      // Easy/Medium: random tables
      a = rand(2, settings.maxTable);
      b = rand(2, settings.maxTable);
    }
    
    answer = a * b;
    
    return {
      prompt: `${a} × ${b} = ?`,
      a, b,
      answer: answer.toString(),
      visual: a <= 5 && b <= 5 ? generateVisual(a, b) : null
    };
  }

  // Generate visual emoji groups
  function generateVisual(a, b) {
    const emojis = ['🍎', '⭐', '🌟', '🎈', '🍕', '🍪'];
    const emoji = emojis[rand(0, emojis.length - 1)];
    const groups = [];
    for (let i = 0; i < a; i++) {
      groups.push(emoji.repeat(b));
    }
    return groups.join(' ');
  }

  // Draw tank SVG (simplified but faithful to actual design)
  function drawTank(type, facingLeft = false, destroyed = false) {
    const tank = tankDesigns[type] || tankDesigns.pebble;
    const transform = facingLeft ? 'transform="scale(-1, 1) translate(-100, 0)"' : '';
    const filter = destroyed ? 'filter="grayscale(100%) brightness(50%)"' : '';
    
    return `
      <svg viewBox="0 0 100 60" ${filter}>
        <g ${transform}>
          <!-- Treads -->
          <rect x="10" y="40" width="35" height="10" rx="5" fill="#1F2937"/>
          <rect x="55" y="40" width="35" height="10" rx="5" fill="#1F2937"/>
          <ellipse cx="27" cy="48" rx="12" ry="4" fill="${tank.color}" opacity="0.3"/>
          <ellipse cx="73" cy="48" rx="12" ry="4" fill="${tank.color}" opacity="0.3"/>
          
          <!-- Body -->
          <rect x="15" y="25" width="70" height="20" rx="3" fill="${tank.color}"/>
          <rect x="20" y="28" width="60" height="14" rx="2" fill="#1F2937" opacity="0.3"/>
          
          <!-- Turret -->
          <rect x="35" y="15" width="30" height="15" rx="4" fill="${tank.color}"/>
          <circle cx="50" cy="22" r="8" fill="#1F2937" opacity="0.3"/>
          
          <!-- Cannon -->
          <rect x="65" y="19" width="30" height="6" rx="2" fill="#374151"/>
          <rect x="90" y="17" width="8" height="10" rx="1" fill="#1F2937"/>
          
          <!-- Accents -->
          <line x1="20" y1="35" x2="80" y2="35" stroke="${tank.color}" stroke-width="2" opacity="0.6"/>
          ${destroyed ? '<text x="50" y="35" text-anchor="middle" font-size="20">💥</text>' : ''}
        </g>
      </svg>
    `;
  }

  // Draw missile
  function drawMissile(fromLeft = true) {
    const x = fromLeft ? 0 : 100;
    const dir = fromLeft ? 1 : -1;
    return `
      <svg viewBox="0 0 100 20" class="battle-missile ${fromLeft ? 'from-left' : 'from-right'}">
        <ellipse cx="${50}" cy="10" rx="15" ry="6" fill="#FF5722"/>
        <polygon points="${50 + 15 * dir},10 ${50 + 25 * dir},5 ${50 + 25 * dir},15" fill="#FF5722"/>
        <ellipse cx="${50 - 10 * dir}" cy="10" rx="8" ry="4" fill="#FFA726"/>
        <ellipse cx="${50 - 20 * dir}" cy="10" rx="6" ry="3" fill="#FFCC80" opacity="0.8"/>
      </svg>
    `;
  }

  // Render menu
  function renderMenu() {
    el.innerHTML = `
      <div class="battle-menu">
        <div class="battle-menu-header">
          <div class="battle-menu-icon">⚔️</div>
          <h3>Math Tank Battle</h3>
          <p>Solve multiplication to fire missiles!</p>
        </div>
        
        <div class="battle-menu-section">
          <div class="battle-menu-label">Select Difficulty</div>
          <div class="battle-difficulty-grid">
            ${Object.entries(difficultySettings).map(([key, val]) => `
              <button class="battle-diff-btn ${difficulty === key ? 'active' : ''}" data-diff="${key}">
                <span class="battle-diff-name">${val.label}</span>
                <span class="battle-diff-desc">${val.desc}</span>
              </button>
            `).join('')}
          </div>
        </div>
        
        <div class="battle-menu-section">
          <div class="battle-menu-label">Your Tank</div>
          <div class="battle-tank-preview">
            ${drawTank(playerTank)}
          </div>
          <div class="battle-tank-grid">
            ${Object.entries(tankDesigns).map(([key, val]) => `
              <button class="battle-tank-btn ${playerTank === key ? 'active' : ''}" data-tank="${key}">
                <span style="font-size: 1.5rem">${val.emoji}</span>
              </button>
            `).join('')}
          </div>
        </div>
        
        <button class="battle-start-btn">
          <span>⚔️ Start Battle!</span>
        </button>
      </div>
    `;
    
    // Event listeners
    el.querySelectorAll('.battle-diff-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        difficulty = btn.dataset.diff;
        renderMenu();
      });
    });
    
    el.querySelectorAll('.battle-tank-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        playerTank = btn.dataset.tank;
        renderMenu();
      });
    });
    
    el.querySelector('.battle-start-btn').addEventListener('click', startBattle);
  }

  // Start battle
  function startBattle() {
    gameActive = true;
    playerHP = 100;
    enemyHP = 100;
    playerMaxHP = 100;
    enemyMaxHP = 100;
    turnNum = 0;
    score = 0;
    phase = 'attack';
    
    // For hard mode, pick a random table
    if (difficulty === 'hard') {
      battleTableNumber = rand(6, 12);
    } else {
      battleTableNumber = null;
    }
    
    // Random enemy tank
    const tanks = Object.keys(tankDesigns);
    enemyTank = tanks[rand(0, tanks.length - 1)];
    
    nextTurn();
  }

  // Next turn
  function nextTurn() {
    if (playerHP <= 0) {
      endBattle(false);
      return;
    }
    if (enemyHP <= 0) {
      endBattle(true);
      return;
    }
    
    turnNum++;
    answered = false;
    userAnswer = '';
    currentQ = generateQuestion();
    
    // Alternate attack/defense
    phase = turnNum % 2 === 1 ? 'attack' : 'defend';
    
    const settings = difficultySettings[difficulty];
    timer = settings.timerSeconds;
    
    // Start timer
    if (timerInterval) clearInterval(timerInterval);
    timerInterval = setInterval(() => {
      timer -= 0.1;
      if (timer <= 0) {
        handleTimeout();
      } else {
        updateTimerUI();
      }
    }, 100);
    
    renderBattle();
  }

  // Update timer UI without full re-render
  function updateTimerUI() {
    const settings = difficultySettings[difficulty];
    const timerPct = Math.max(0, (timer / settings.timerSeconds) * 100);
    const timerColor = timerPct > 66 ? '#22C55E' : timerPct > 33 ? '#FBBF24' : '#EF4444';
    
    const timerFill = el.querySelector('.battle-timer-fill');
    if (timerFill) {
      timerFill.style.width = `${timerPct}%`;
      timerFill.style.background = timerColor;
    }
  }

  // Handle timeout
  function handleTimeout() {
    if (answered) return;
    answered = true;
    clearInterval(timerInterval);
    
    if (phase === 'attack') {
      // Missed shot - no damage to enemy
    } else {
      // Failed defense - take damage
      playerHP = Math.max(0, playerHP - rand(18, 25));
    }
    
    setTimeout(nextTurn, 1500);
    renderBattle();
  }

  // Handle answer submit
  function handleSubmit() {
    if (answered || !userAnswer) return;
    
    const isCorrect = userAnswer === currentQ.answer;
    answered = true;
    clearInterval(timerInterval);
    
    const settings = difficultySettings[difficulty];
    const timerPct = timer / settings.timerSeconds;
    
    if (isCorrect) {
      score += 10;
      if (phase === 'attack') {
        // Hit enemy - damage based on speed
        const baseDamage = 15;
        const speedBonus = timerPct > 0.66 ? 1.3 : timerPct > 0.33 ? 1.0 : 0.7;
        const damage = Math.round(baseDamage * speedBonus);
        enemyHP = Math.max(0, enemyHP - damage);
      } else {
        // Successful defense - reduce incoming damage
        const reduction = timerPct > 0.66 ? 0.6 : timerPct > 0.33 ? 0.3 : 0.1;
        const incoming = rand(15, 20);
        const blocked = Math.round(incoming * reduction);
        playerHP = Math.max(0, playerHP - (incoming - blocked));
      }
    } else {
      if (phase === 'attack') {
        // Missed shot
      } else {
        // Failed defense
        playerHP = Math.max(0, playerHP - rand(18, 25));
      }
    }
    
    setTimeout(nextTurn, 1500);
    renderBattle();
  }

  // Handle numpad input
  function handleNumpad(num) {
    if (answered) return;
    if (num === 'clear') {
      userAnswer = '';
    } else if (num === 'back') {
      userAnswer = userAnswer.slice(0, -1);
    } else {
      if (userAnswer.length < 3) {
        userAnswer += num;
      }
    }
    updateAnswerUI();
  }

  // Update answer display
  function updateAnswerUI() {
    const answerEl = el.querySelector('.battle-answer-display');
    if (answerEl) {
      answerEl.textContent = userAnswer || '_';
    }
  }

  // End battle
  function endBattle(won) {
    gameActive = false;
    clearInterval(timerInterval);
    
    const finalScore = score + (won ? 100 : 0);
    
    el.innerHTML = `
      <div class="battle-result ${won ? 'won' : 'lost'}">
        <div class="battle-result-icon">${won ? '🏆' : '💔'}</div>
        <h3>${won ? 'Victory!' : 'Defeated'}</h3>
        <p>${won ? 'Enemy tank destroyed!' : 'Your tank was destroyed!'}</p>
        
        <div class="battle-result-stats">
          <div class="battle-stat">
            <span class="battle-stat-value">${finalScore}</span>
            <span class="battle-stat-label">Score</span>
          </div>
          <div class="battle-stat">
            <span class="battle-stat-value">${turnNum}</span>
            <span class="battle-stat-label">Turns</span>
          </div>
        </div>
        
        <div class="battle-result-cta">
          <button class="battle-play-again-btn">⚔️ Battle Again</button>
          <a href="#download" class="battle-download-btn">📲 Get Full Game</a>
        </div>
      </div>
    `;
    
    el.querySelector('.battle-play-again-btn').addEventListener('click', renderMenu);
  }

  // Render battle view
  function renderBattle() {
    const settings = difficultySettings[difficulty];
    const timerPct = Math.max(0, (timer / settings.timerSeconds) * 100);
    const timerColor = timerPct > 66 ? '#22C55E' : timerPct > 33 ? '#FBBF24' : '#EF4444';
    
    const playerHPPct = (playerHP / playerMaxHP) * 100;
    const enemyHPPct = (enemyHP / enemyMaxHP) * 100;
    
    el.innerHTML = `
      <div class="battle-arena">
        <!-- Health Bars -->
        <div class="battle-hp-row">
          <div class="battle-hp-container player">
            <span class="battle-hp-label">You</span>
            <div class="battle-hp-bar">
              <div class="battle-hp-fill" style="width: ${playerHPPct}%; background: #22C55E"></div>
            </div>
            <span class="battle-hp-value">${Math.round(playerHPPct)}%</span>
          </div>
          <div class="battle-phase-badge ${phase}">${phase === 'attack' ? '⚔️ ATTACK' : '🛡️ DEFEND'}</div>
          <div class="battle-hp-container enemy">
            <span class="battle-hp-label">Enemy</span>
            <div class="battle-hp-bar">
              <div class="battle-hp-fill" style="width: ${enemyHPPct}%; background: #EF4444"></div>
            </div>
            <span class="battle-hp-value">${Math.round(enemyHPPct)}%</span>
          </div>
        </div>
        
        <!-- Battlefield -->
        <div class="battle-field">
          <div class="battle-tank-container player">
            ${drawTank(playerTank, false, playerHP <= 0)}
          </div>
          <div class="battle-tank-container enemy">
            ${drawTank(enemyTank, true, enemyHP <= 0)}
          </div>
        </div>
        
        <!-- Timer bar -->
        <div class="battle-timer-bar">
          <div class="battle-timer-fill" style="width: ${timerPct}%; background: ${timerColor}"></div>
        </div>
      </div>
      
      <!-- Question area -->
      <div class="battle-question-area">
        ${battleTableNumber ? `<div class="battle-table-badge">📚 Table of ${battleTableNumber}</div>` : ''}
        <div class="battle-question">${currentQ.prompt}</div>
        ${currentQ.visual ? `<div class="battle-visual">${currentQ.visual}</div>` : ''}
        
        <div class="battle-answer">
          <span class="battle-answer-display">${userAnswer || '_'}</span>
        </div>
        
        <div class="battle-numpad">
          ${[1,2,3,4,5,6,7,8,9,'clear',0,'back'].map(n => `
            <button class="battle-numpad-btn ${n === 'clear' || n === 'back' ? 'action' : ''}" data-num="${n}">
              ${n === 'clear' ? '⌫' : n === 'back' ? '↩' : n}
            </button>
          `).join('')}
        </div>
        
        <button class="battle-submit-btn" ${userAnswer ? '' : 'disabled'}>
          ${phase === 'attack' ? '🚀 Fire!' : '🛡️ Block!'}
        </button>
      </div>
    `;
    
    // Event listeners
    el.querySelectorAll('.battle-numpad-btn').forEach(btn => {
      btn.addEventListener('click', () => handleNumpad(btn.dataset.num));
    });
    
    el.querySelector('.battle-submit-btn').addEventListener('click', handleSubmit);
  }

  // Initialize
  renderMenu();
  el._restart = renderMenu;
  el._start = startBattle;
}

// ============================================================================
// INITIALIZATION
// ============================================================================

document.addEventListener('DOMContentLoaded', () => {
  // Initialize high-fidelity game demos
  initTimeRaceGamePro();
  initMathBattleGamePro();
});
