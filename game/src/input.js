// Keyboard + mouse input: held movement keys, one-shot action flags (enter car, pause,
// interact) and the mouse position/aim used by the pistol. Presses are queued so a tap
// between frames is never lost.
export const ACT_ENTER = 1;
export const ACT_PAUSE = 2;
export const ACT_INTERACT = 4;
export const ACT_RELOAD = 8;
export const ACT_WEAPON = 16;

export function createInput(canvas) {
  const keys = new Set();
  const pressed = new Set(); // codes tapped since the last clearPressed() — survives quick taps
  let actions = 0;
  const mouse = { x: 640, y: 360, down: false, sx: 0, sy: 0 };

  window.addEventListener('keydown', (e) => {
    keys.add(e.code);
    if (!e.repeat) pressed.add(e.code);
    if (!e.repeat) {
      if (e.code === 'KeyF' || e.code === 'Enter') actions |= ACT_ENTER;
      if (e.code === 'KeyP' || e.code === 'Escape') actions |= ACT_PAUSE;
      if (e.code === 'KeyE') actions |= ACT_INTERACT;
      if (e.code === 'KeyR') actions |= ACT_RELOAD;
      if (e.code === 'Digit1' || e.code === 'Digit2' || e.code === 'KeyQ') actions |= ACT_WEAPON;
    }
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) e.preventDefault();
  });
  window.addEventListener('keyup', (e) => keys.delete(e.code));
  window.addEventListener('blur', () => { keys.clear(); mouse.down = false; });
  canvas.addEventListener('pointermove', (e) => {
    const r = canvas.getBoundingClientRect();
    mouse.sx = e.clientX - r.left; mouse.sy = e.clientY - r.top;
    mouse.x = (e.clientX - r.left) * (canvas.width / Math.max(1, r.width));
    mouse.y = (e.clientY - r.top) * (canvas.height / Math.max(1, r.height));
  });
  canvas.addEventListener('pointerdown', (e) => { if (e.button === 0) mouse.down = true; });
  window.addEventListener('pointerup', (e) => { if (e.button === 0) mouse.down = false; });

  return {
    keys, mouse,
    down(...codes) { return codes.some((c) => keys.has(c)); },
    wasPressed(code) { return pressed.has(code); },
    clearPressed() { pressed.clear(); },
    takeActions() { const a = actions; actions = 0; return a; },
    peekActions() { return actions; },
  };
}
