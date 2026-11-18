// Solstice Bay PD: wanted stars 0-5, escalating pursuit, foot officers, roadblocks
// at high heat, BUSTED when an officer holds you at low speed, and heat that cools
// when you break line of sight.
import { POLICE_HQ, clamp, dist } from './config.js';
import { createCar } from './vehicles.js';

export function starsForHeat(heat) {
  if (heat <= 0) return 0;
  return clamp(Math.ceil(heat / 22), 1, 5);
}
export function addHeat(G, amount, x, y) {
  G.heat = clamp(G.heat + amount, 0, 110);
  G.lastCrime = { x, y, t: 0 };
  G.seenT = 0;
}

export function spawnPolice(G) { G.policeCars = []; G.cops = []; G.roadblocks = []; }

function desiredUnits(G) {
  const s = starsForHeat(G.heat);
  return [0, 1, 2, 3, 4, 6][s] || 0;
}

function spawnCopCar(G) {
  const rand = G.rand;
  const a = rand() * Math.PI * 2;
  const d = 620 + rand() * 260;
  const x = clamp(G.player.x + Math.cos(a) * d, 120, 5280);
  const y = clamp(G.player.y + Math.sin(a) * d, 180, 3480);
  const car = createCar(x, y, a + Math.PI, 'police');
  car.isPolice = true;
  G.policeCars.push(car);
}
function spawnRoadblock(G) {
  const rand = G.rand;
  const ahead = (G.player.car && Math.abs(G.player.car.speed) > 60) ? G.player.car.angle : G.player.angle;
  const bx = clamp(G.player.x + Math.cos(ahead) * 520, 140, 5260);
  const by = clamp(G.player.y + Math.sin(ahead) * 520, 200, 3460);
  const cars = [];
  for (let i = -1; i <= 1; i++) {
    const c = createCar(bx + Math.cos(ahead + Math.PI / 2) * i * 46, by + Math.sin(ahead + Math.PI / 2) * i * 46, ahead + Math.PI / 2, 'police');
    c.isPolice = true; c.speed = 0; c.isBlock = true;
    cars.push(c); G.roadblocks.push(c);
  }
  G.roadblockCd = 26;
}

export function updatePolice(G, dt) {
  const stars = starsForHeat(G.heat);
  const px = G.player.car ? G.player.car.x : G.player.x;
  const py = G.player.car ? G.player.car.y : G.player.y;
  // Sight: any cop car within 460 sees the player.
  let seen = false;
  for (const c of G.policeCars) if (dist(c.x, c.y, px, py) < 460) seen = true;
  if (seen) { G.seenT = 0; G.lastSeen = { x: px, y: py }; }
  else G.seenT += dt;
  if (stars > 0 && G.seenT > 9) {
    G.heat = Math.max(0, G.heat - dt * 3.2);
    if (G.heat <= 0) { G.flashMessage('You lost the cops. Heat cleared.', '#7CFC98'); }
  }
  // Spawn / despawn to the wanted level.
  const want = desiredUnits(G);
  G.spawnCd = (G.spawnCd || 0) - dt;
  if (G.policeCars.filter((c) => !c.isBlock).length < want && G.spawnCd <= 0) { spawnCopCar(G); G.spawnCd = 1.4; }
  if (stars >= 4 && (G.roadblockCd = (G.roadblockCd || 0) - dt) <= 0 && G.roadblocks.length === 0) spawnRoadblock(G);
  if (stars < 3) { for (const b of G.roadblocks) b.hp = 0; G.roadblocks = G.roadblocks.filter((b) => b.hp > 0); }
  G.policeCars = G.policeCars.filter((c) => {
    if (c.hp <= 0) return false;
    if (stars === 0 && dist(c.x, c.y, px, py) > 700) return false;
    return true;
  });

  let nearestCop = 99999;
  for (const car of G.policeCars) {
    if (car.isBlock) continue;
    const d = dist(car.x, car.y, px, py);
    nearestCop = Math.min(nearestCop, d);
    const tx = G.lastSeen ? G.lastSeen.x : POLICE_HQ.x;
    const ty = G.lastSeen ? G.lastSeen.y : POLICE_HQ.y;
    const targetAngle = Math.atan2(ty - car.y, tx - car.x);
    let dA = (targetAngle - car.angle) % (Math.PI * 2);
    if (dA > Math.PI) dA -= Math.PI * 2; if (dA < -Math.PI) dA += Math.PI * 2;
    const steer = clamp(dA * 1.7, -0.55, 0.55);
    let throttle = 1;
    if (d < 60) throttle = 0.25;
    if (Math.abs(dA) > 2.4) throttle = -0.7; // reverse out of a bad angle
    const def = car.def;
    car.speed += throttle * def.accel * dt;
    car.speed -= car.speed * 0.5 * dt;
    car.speed = clamp(car.speed, -def.topSpeed * 0.35, def.topSpeed * (0.82 + stars * 0.045));
    car.angle += steer * (car.speed / 90) * dt * 2.1;
    const nx = car.x + Math.cos(car.angle) * car.speed * dt;
    const ny = car.y + Math.sin(car.angle) * car.speed * dt;
    if (!G.world.carBlocked(nx, ny, car.angle, car.len, car.wid)) { car.x = nx; car.y = ny; }
    else { car.speed *= -0.3; car.hp -= 2; }
    // Ram damage to the player's car.
    if (G.player.car && dist(car.x, car.y, G.player.car.x, G.player.car.y) < 44 && Math.abs(car.speed) > 120) {
      G.player.car.hp -= 9 * dt * 10 * 0.1; G.player.health -= 2.2 * dt;
    }
  }
  G.nearestCopDist = nearestCop;

  // BUSTED: on foot or crawling, a close cop holds you for 2.4 s.
  const slow = !G.player.car || Math.abs(G.player.car.speed) < 26;
  if (stars >= 1 && slow && nearestCop < 74 && G.screen === 'play') {
    G.bustT = (G.bustT || 0) + dt;
    if (G.bustT > 2.4) { G.busted(); }
  } else G.bustT = Math.max(0, (G.bustT || 0) - dt * 2);
}
