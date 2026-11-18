// The player: Dario Solano on foot (walk/run, smooth facing) and behind the wheel.
// Handles entering/leaving cars (stealing parked or traffic cars raises heat),
// vehicle damage and the handbrake.
import { PLAYER_SPEED_WALK, PLAYER_SPEED_RUN, PLAYER_RADIUS, clamp, dist } from './config.js';
import { stepCar } from './vehicles.js';
import { addHeat } from './police.js';
import { ACT_ENTER } from './input.js';

export function createPlayer(saved) {
  const p = {
    x: 1640, y: 1740, angle: -Math.PI / 2, health: 100, armor: 0, money: 120,
    car: null, walkPhase: 0, moving: false, respect: 0,
    weapon: 'fist', ammo: 0, reserve: 48, fireCd: 0, punchCd: 0, hurtT: 0,
  };
  if (saved) {
    p.x = saved.x ?? p.x; p.y = saved.y ?? p.y; p.money = saved.money ?? p.money;
    p.health = clamp(saved.health ?? 100, 20, 100); p.armor = saved.armor ?? 0; p.respect = saved.respect ?? 0;
    if (p.money >= 60) { p.weapon = 'pistol'; p.ammo = 12; }
  }
  return p;
}

export function nearestEnterableCar(G) {
  let best = null, bd = 64;
  const all = [...G.parked, ...G.traffic, ...G.policeCars];
  for (const c of all) {
    if (c.hp <= 0) continue;
    const d = dist(G.player.x, G.player.y, c.x, c.y);
    if (d < bd) { bd = d; best = c; }
  }
  return best;
}

export function updatePlayer(G, dt) {
  const p = G.player;
  const input = G.input;
  if (p.fireCd > 0) p.fireCd -= dt;
  if (p.punchCd > 0) p.punchCd -= dt;
  if (p.hurtT > 0) p.hurtT -= dt;
  p.health = Math.min(100, p.health + (p.car ? 0.7 : 0.35) * dt); // slow regen

  const actions = input.peekActions();
  if (p.car) {
    const ctrl = {
      throttle: (input.down('KeyW', 'ArrowUp') ? 1 : 0) + (input.down('KeyS', 'ArrowDown') ? -1 : 0),
      steer: (input.down('KeyD', 'ArrowRight') ? 1 : 0) + (input.down('KeyA', 'ArrowLeft') ? -1 : 0),
      brake: input.down('Space'),
    };
    const wasSpeed = Math.abs(p.car.speed);
    const hit = stepCar(p.car, ctrl, G.world, dt);
    if (hit && wasSpeed > 170) { G.audio.crash(); addHeat(G, 1.5, p.car.x, p.car.y); G.shake = Math.min(9, wasSpeed * 0.02); }
    p.x = p.car.x; p.y = p.car.y; p.angle = p.car.angle;
    if (p.car.hp <= 0) { p.health -= 18; exitCar(G, true); G.flashMessage('Your ride is wrecked!', '#ff8080'); }
    if (actions & ACT_ENTER) { input.takeActions(); exitCar(G, false); }
    return;
  }

  // On foot.
  let mx = (input.down('KeyD', 'ArrowRight') ? 1 : 0) - (input.down('KeyA', 'ArrowLeft') ? 1 : 0);
  let my = (input.down('KeyS', 'ArrowDown') ? 1 : 0) - (input.down('KeyW', 'ArrowUp') ? 1 : 0);
  const running = input.down('ShiftLeft', 'ShiftRight');
  p.moving = mx !== 0 || my !== 0;
  if (p.moving) {
    const len = Math.hypot(mx, my); mx /= len; my /= len;
    const sp = running ? PLAYER_SPEED_RUN : PLAYER_SPEED_WALK;
    G.world.moveCircle(p, mx * sp * dt, my * sp * dt, PLAYER_RADIUS);
    p.walkPhase += dt * (running ? 11 : 8);
    if (G.input.mouse.down && p.weapon === 'pistol') { /* aim while moving */ }
    else p.angle = Math.atan2(my, mx);
  }
  // Mouse aim when armed.
  if (p.weapon === 'pistol') {
    const wx = G.camera.x + G.input.mouse.x - 640 + 640; // mouse.x is canvas px at 1280 wide logical
    void wx;
    p.angle = Math.atan2((G.camera.y + G.input.mouse.y) - p.y, (G.camera.x + G.input.mouse.x) - p.x);
  }
  if (actions & ACT_ENTER) {
    const car = nearestEnterableCar(G);
    if (car) { input.takeActions(); enterCar(G, car); }
  }
}

function enterCar(G, car) {
  const p = G.player;
  p.car = car; car.driver = 'player'; car.speed = 0;
  const remove = (list) => { const i = list.indexOf(car); if (i >= 0) list.splice(i, 1); };
  const wasParked = G.parked.includes(car);
  remove(G.parked); remove(G.traffic); remove(G.policeCars); remove(G.roadblocks);
  if (car.isPolice) { addHeat(G, 26, car.x, car.y); G.flashMessage('You stole a police interceptor!', '#ffb3b3'); }
  else if (!wasParked) { addHeat(G, 14, car.x, car.y); G.flashMessage('Grand theft auto! The owner called it in.', '#ffd28a'); }
  else addHeat(G, 4, car.x, car.y);
  G.audio.ui();
}
function exitCar(G, wrecked) {
  const p = G.player;
  const car = p.car; if (!car) return;
  p.car = null; car.driver = null;
  p.x = car.x + Math.cos(car.angle - Math.PI / 2) * 30;
  p.y = car.y + Math.sin(car.angle - Math.PI / 2) * 30;
  if (G.world.hitsBuilding(p.x, p.y, 12)) { p.x = car.x; p.y = car.y; }
  if (!wrecked && car.hp > 0) G.parked.push(car);
  G.audio.ui();
}
export { PLAYER_RADIUS };
