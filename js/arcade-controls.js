(function () {
  'use strict';

  function ignoreKeyEvent(event) {
    if (event.defaultPrevented || event.ctrlKey || event.metaKey || event.altKey) return true;
    const target = event.target;
    return target instanceof HTMLElement && (
      Boolean(target.closest('.arcade-modal, input, textarea, select, [contenteditable="true"]')) ||
      (['Space', 'Enter'].includes(event.code) && Boolean(target.closest('button, a')))
    );
  }

  function create(options) {
    const { canvas, width, height, keys, actions, getState, pause, resume, restart, help } = options;
    if (!(canvas instanceof HTMLCanvasElement) || !canvas.closest('.game-page')) {
      throw new Error('Arcade controls require a canvas inside .game-page.');
    }
    if (![getState, pause, resume, restart].every(fn => typeof fn === 'function')) {
      throw new Error('Arcade controls require explicit state, pause, resume and restart handlers.');
    }

    const page = canvas.closest('.game-page');
    if (page.dataset.arcadeReady) throw new Error('Arcade controls were already mounted.');
    page.dataset.arcadeReady = 'true';
    document.body.dataset.arcadeControls = 'true';
    canvas.tabIndex = 0;
    canvas.setAttribute('aria-label', 'Game field. Move with WASD or arrow keys; choose How to play for all controls.');
    const area = page.querySelector('.game-area');
    let column = canvas.closest('.game-canvas-col');
    if (!column) {
      column = document.createElement('div');
      column.className = 'game-canvas-col';
      canvas.before(column);
      column.append(canvas);
    }
    let stage = canvas.closest('#gameContainer');
    if (!stage) {
      stage = document.createElement('div');
      const originalParent = canvas.parentElement;
      const overlay = originalParent.querySelector('#overlay');
      canvas.before(stage);
      stage.append(canvas);
      if (overlay && overlay.parentElement === originalParent) stage.append(overlay);
    }
    stage.classList.add('arcade-stage');

    const tools = document.createElement('div');
    tools.className = 'arcade-tools';
    const pauseButton = button('Pause', 'Pause game');
    const helpButton = button('?', 'How to play');
    tools.append(pauseButton, helpButton);
    let overview = false;
    let mapButton;
    if (options.map) {
      mapButton = button('Map', 'Show whole maze');
      mapButton.setAttribute('aria-pressed', 'false');
      tools.prepend(mapButton);
      mapButton.addEventListener('click', () => {
        overview = !overview;
        mapButton.setAttribute('aria-pressed', String(overview));
        mapButton.setAttribute('aria-label', overview ? 'Follow the player' : 'Show whole maze');
        mapButton.textContent = overview ? 'Follow' : 'Map';
      });
    }
    page.querySelector('.game-topbar').append(tools);

    const hud = document.createElement('p');
    hud.className = 'arcade-hud';
    hud.setAttribute('aria-label', 'Game status');
    area.before(hud);
    const dock = document.createElement('div');
    dock.className = 'arcade-touch-controls';
    dock.setAttribute('aria-label', 'Touch game controls');
    dock.setAttribute('role', 'group');
    const stick = button('', 'Movement thumbstick. Drag to move, or use WASD or arrow keys.');
    stick.className = 'arcade-stick';
    const knob = document.createElement('span');
    knob.className = 'arcade-stick-knob';
    knob.setAttribute('aria-hidden', 'true');
    const moveLabel = document.createElement('span');
    moveLabel.className = 'arcade-stick-label';
    moveLabel.textContent = 'MOVE';
    moveLabel.setAttribute('aria-hidden', 'true');
    stick.append(knob, moveLabel);
    const actionGroup = document.createElement('div');
    actionGroup.className = 'arcade-actions';
    actionGroup.style.gridTemplateColumns = `repeat(${actions.length === 4 ? 2 : Math.min(3, actions.length)}, minmax(48px, 1fr))`;
    dock.append(stick, actionGroup);
    page.append(dock);

    const dialog = document.createElement('div');
    dialog.className = 'arcade-modal';
    dialog.hidden = true;
    dialog.setAttribute('role', 'dialog');
    dialog.setAttribute('aria-modal', 'true');
    dialog.setAttribute('aria-labelledby', 'arcade-dialog-title');
    area.append(dialog);
    const notice = document.createElement('p');
    notice.className = 'arcade-notice';
    notice.setAttribute('role', 'status');
    area.append(notice);

    const direction = { x: 0, y: 0 };
    const pointers = new Map();
    const held = new Map();
    const actionButtons = new Map();
    const modalBackground = new Map();
    const media = matchMedia('(max-width: 900px), (pointer: coarse)');
    let active = false;
    let stickPointer = null;
    let helpOpen = false;
    let modalKey = '';
    let modalReturn = null;
    let announcement = '';
    let dimensions = { width: width, height: height, ratio: 1, overlay: 0 };
    let camera = { x: 0, y: 0, scale: 1 };

    function button(text, label) {
      const element = document.createElement('button');
      element.type = 'button';
      element.textContent = text;
      if (label) element.setAttribute('aria-label', label);
      return element;
    }

    function pressAction(action) {
      if (active && !actionButtons.get(action.id).button.disabled && action.press) action.press();
    }

    function setHeld(id, value, pressed) {
      if (!held.has(id)) held.set(id, new Set());
      if (pressed) held.get(id).add(value);
      else held.get(id).delete(value);
      const control = actionButtons.get(id);
      control.button.dataset.held = String(held.get(id).size > 0);
      if (control.action.hold) control.button.setAttribute('aria-pressed', String(held.get(id).size > 0));
    }

    function releasePointer(id) {
      const pointer = pointers.get(id);
      if (!pointer) return;
      pointers.delete(id);
      if (pointer.kind === 'stick') {
        stickPointer = null;
        direction.x = direction.y = 0;
        knob.style.transform = '';
      } else {
        setHeld(pointer.id, id, false);
      }
      if (pointer.element.hasPointerCapture(id)) pointer.element.releasePointerCapture(id);
    }

    function clear() {
      [...pointers.keys()].forEach(releasePointer);
      for (const [id, values] of held) {
        [...values].forEach(value => setHeld(id, value, false));
      }
      Object.keys(keys).forEach(key => { keys[key] = false; });
      direction.x = direction.y = 0;
      knob.style.transform = '';
    }

    function updateStick(event) {
      const rect = stick.getBoundingClientRect();
      const radius = rect.width * .34;
      const dx = (event.clientX - rect.left - rect.width / 2) / radius;
      const dy = (event.clientY - rect.top - rect.height / 2) / radius;
      const distance = Math.hypot(dx, dy);
      direction.x = distance < .15 ? 0 : dx / Math.max(1, distance);
      direction.y = distance < .15 ? 0 : dy / Math.max(1, distance);
      knob.style.transform = `translate(${direction.x * radius}px, ${direction.y * radius}px)`;
    }

    stick.addEventListener('pointerdown', event => {
      if (!active || event.button !== 0 || stickPointer !== null) return;
      event.preventDefault();
      stickPointer = event.pointerId;
      pointers.set(event.pointerId, { kind: 'stick', element: stick });
      stick.setPointerCapture(event.pointerId);
      updateStick(event);
    });
    stick.addEventListener('pointermove', event => {
      if (event.pointerId === stickPointer) updateStick(event);
    });
    stick.addEventListener('lostpointercapture', event => releasePointer(event.pointerId));

    for (const action of actions) {
      if (actionButtons.has(action.id)) throw new Error('Duplicate arcade action: ' + action.id);
      const control = button('', action.description || action.label);
      control.className = 'arcade-action' + (action.primary ? ' arcade-action--primary' : '');
      control.dataset.action = action.id;
      const label = document.createElement('span');
      label.textContent = action.label;
      const detail = document.createElement('small');
      control.append(label, detail);
      actionGroup.append(control);
      actionButtons.set(action.id, { button: control, detail, action });
      if (action.hold) control.setAttribute('aria-pressed', 'false');
      control.addEventListener('pointerdown', event => {
        if (!active || control.disabled || event.button !== 0) return;
        event.preventDefault();
        pointers.set(event.pointerId, { kind: 'action', id: action.id, element: control });
        control.setPointerCapture(event.pointerId);
        setHeld(action.id, event.pointerId, true);
        pressAction(action);
      });
      control.addEventListener('lostpointercapture', event => releasePointer(event.pointerId));
      control.addEventListener('click', event => {
        if (event.detail === 0 && !action.hold) pressAction(action);
      });
      if (action.hold) {
        control.addEventListener('keydown', event => {
          if (!['Space', 'Enter'].includes(event.code) || event.repeat || !active) return;
          event.preventDefault();
          setHeld(action.id, 'keyboard', true);
        });
        control.addEventListener('keyup', event => {
          if (!['Space', 'Enter'].includes(event.code)) return;
          event.preventDefault();
          setHeld(action.id, 'keyboard', false);
        });
        control.addEventListener('blur', () => setHeld(action.id, 'keyboard', false));
      }
    }
    window.addEventListener('pointerup', event => releasePointer(event.pointerId));
    window.addEventListener('pointercancel', event => releasePointer(event.pointerId));
    dock.addEventListener('contextmenu', event => event.preventDefault());

    function togglePause() {
      const state = getState();
      clear();
      if (state.paused) resume();
      else if (state.active) pause();
    }
    function suspend() {
      clear();
      if (getState().active) pause();
    }
    function showHelp() {
      suspend();
      helpOpen = true;
    }
    pauseButton.addEventListener('click', togglePause);
    helpButton.addEventListener('click', showHelp);
    window.addEventListener('blur', suspend);
    window.addEventListener('pagehide', suspend);
    document.addEventListener('visibilitychange', () => { if (document.hidden) suspend(); });
    if (screen.orientation) screen.orientation.addEventListener('change', suspend);
    window.addEventListener('resize', clear);
    media.addEventListener('change', () => { clear(); resize(); });

    document.addEventListener('keydown', event => {
      if (dialog.hidden || event.ctrlKey || event.metaKey || event.altKey) return;
      if (event.code === 'KeyP' && !event.repeat && !helpOpen && getState().paused) {
        resume();
        event.preventDefault();
        event.stopImmediatePropagation();
        return;
      }
      if (event.code === 'Escape') {
        if (helpOpen) helpOpen = false;
        else if (getState().paused) resume();
        event.preventDefault();
        event.stopImmediatePropagation();
      } else if (event.code === 'Tab') {
        const buttons = [...dialog.querySelectorAll('button, a[href]')].filter(element => !element.disabled);
        const first = buttons[0], last = buttons.at(-1);
        if (!buttons.includes(document.activeElement) ||
            (event.shiftKey && document.activeElement === first) ||
            (!event.shiftKey && document.activeElement === last)) {
          (event.shiftKey ? last : first).focus();
          event.preventDefault();
        }
      }
    }, true);

    function resize() {
      const rect = column.getBoundingClientRect();
      const style = getComputedStyle(column);
      const availableWidth = Math.max(1, rect.width - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight));
      const availableHeight = Math.max(1, rect.height - parseFloat(style.paddingTop) - parseFloat(style.paddingBottom));
      const fit = Math.min(1, availableWidth / width, availableHeight / height);
      stage.style.width = (media.matches ? availableWidth : width * fit) + 'px';
      stage.style.height = (media.matches ? availableHeight : height * fit) + 'px';
      const ratio = Math.min(devicePixelRatio || 1, 2);
      const physicalWidth = Math.max(1, canvas.clientWidth);
      const physicalHeight = Math.max(1, canvas.clientHeight);
      const backingWidth = Math.round(physicalWidth * ratio);
      const backingHeight = Math.round(physicalHeight * ratio);
      if (canvas.width !== backingWidth || canvas.height !== backingHeight) {
        canvas.width = backingWidth;
        canvas.height = backingHeight;
      }
      dimensions = {
        width: physicalWidth, height: physicalHeight, ratio,
        overlay: getComputedStyle(dock).position === 'absolute' ? dock.getBoundingClientRect().height : 0,
      };
    }
    new ResizeObserver(resize).observe(column);
    resize();

    // Keep physics in the original world; scale only drawing and pointer coordinates.
    function beginFrame(ctx, position) {
      const view = dimensions;
      let scale = Math.min(view.width / width, view.height / height);
      if (media.matches && !overview) {
        scale = Math.min(1, view.width / 500);
        if (options.keepHeight) scale = Math.min(scale, view.height / height);
      }
      const visibleWidth = view.width / scale;
      const visibleHeight = view.height / scale;
      const target = position || { x: width / 2, y: height / 2 };
      const x = visibleWidth >= width ? (width - visibleWidth) / 2 :
        Math.max(0, Math.min(width - visibleWidth, target.x - visibleWidth / 2));
      const centerY = (view.height - view.overlay * .6) / (2 * scale);
      const y = visibleHeight >= height ? (height - visibleHeight) / 2 :
        Math.max(0, Math.min(height - visibleHeight + view.overlay / scale, target.y - centerY));
      camera = { x, y, scale };
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#0a0a0f';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      const zoom = scale * view.ratio;
      ctx.setTransform(zoom, 0, 0, zoom, -x * zoom, -y * zoom);
    }

    function renderModal(menu) {
      if (!menu) {
        if (!dialog.hidden) {
          dialog.hidden = true;
          for (const [element, wasInert] of modalBackground) element.inert = wasInert;
          modalBackground.clear();
          if (active) canvas.focus({ preventScroll: true });
          else if (modalReturn && modalReturn.isConnected) modalReturn.focus({ preventScroll: true });
        }
        modalKey = '';
        return;
      }
      if (menu.key === modalKey) return;
      if (dialog.hidden) {
        modalReturn = document.activeElement;
        for (const element of [page.querySelector('.game-topbar'), dock, ...area.children]) {
          if (element === dialog) continue;
          modalBackground.set(element, element.inert);
          element.inert = true;
        }
      }
      modalKey = menu.key;
      clear();
      const panel = document.createElement('div');
      panel.className = 'arcade-modal-panel';
      const heading = document.createElement('h2');
      heading.id = 'arcade-dialog-title';
      heading.tabIndex = -1;
      heading.textContent = menu.title;
      panel.append(heading);
      for (const paragraph of menu.text) {
        const content = document.createElement('p');
        content.textContent = paragraph;
        panel.append(content);
      }
      const buttons = document.createElement('div');
      buttons.className = 'arcade-modal-actions';
      for (const action of menu.buttons) {
        const control = button(action.label);
        control.addEventListener('click', () => { clear(); action.run(); });
        buttons.append(control);
      }
      panel.append(buttons);
      const back = document.createElement('a');
      back.href = '/play/#creative-arcade';
      back.className = 'arcade-modal-back';
      back.textContent = 'Back to all games';
      panel.append(back);
      dialog.replaceChildren(panel);
      dialog.hidden = false;
      (menu.key === 'help' ? heading : buttons.firstElementChild).focus({ preventScroll: true });
    }

    function refresh() {
      const state = getState();
      if (active && !state.active) clear();
      active = Boolean(state.active);
      page.dataset.arcadePhase = state.phase;
      dock.dataset.active = String(active);
      stick.disabled = !active;
      pauseButton.disabled = !active && !state.paused;
      pauseButton.textContent = state.paused ? 'Resume' : 'Pause';
      pauseButton.setAttribute('aria-label', state.paused ? 'Resume game' : 'Pause game');
      if (hud.textContent !== state.status) hud.textContent = state.status;
      const message = announcement || state.message || '';
      if (notice.textContent !== message) notice.textContent = message;
      for (const [id, control] of actionButtons) {
        const setting = state.actions && state.actions[id];
        const disabled = !active || Boolean(setting && setting.disabled);
        if (disabled && held.has(id)) [...held.get(id)].forEach(value => setHeld(id, value, false));
        control.button.disabled = disabled;
        const detail = setting && setting.detail || '';
        if (control.detail.textContent !== detail) control.detail.textContent = detail;
      }
      let menu = state.menu;
      if (state.paused) menu = {
        key: 'paused', title: 'Game paused',
        text: ['Your game is paused. Resume when you are ready.'],
        buttons: [{ label: 'Resume game', run: resume }, { label: 'How to play', run: showHelp },
          { label: 'Restart this run', run: restart }],
      };
      if (helpOpen) menu = {
        key: 'help', title: 'How to play',
        text: [...help, 'Made from kids’ game ideas, with parent support and AI-assisted coding.'],
        buttons: [{ label: 'Back to game', run: () => { helpOpen = false; } }],
      };
      renderModal(menu);
      requestAnimationFrame(refresh);
    }
    requestAnimationFrame(refresh);

    return {
      direction, clear, togglePause, beginFrame,
      held: id => Boolean(held.get(id) && held.get(id).size),
      point: event => {
        const rect = canvas.getBoundingClientRect();
        return { x: camera.x + (event.clientX - rect.left) / camera.scale,
          y: camera.y + (event.clientY - rect.top) / camera.scale };
      },
      announce: text => { announcement = text; },
      get mobile() { return media.matches; },
    };
  }

  window.ArcadeControls = { create, ignoreKeyEvent };
})();
