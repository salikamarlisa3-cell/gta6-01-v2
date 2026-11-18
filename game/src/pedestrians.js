// Pedestrians for Solstice Bay: they stroll the sidewalks and plazas, chat in pairs,
// and flee screaming (well, silently) from gunfire, fights and speeding cars.
import { PED_COLORS, clamp, dist } from './config.js';
import { isOnRoad } from './world.js';
import { randRange } from './random.js';

export function spawnPeds(G) {
  const rand = G.rand;
  G.peds = [];
  for (let i = 0; i < 56; i++) {
    let x = 0, y = 0, tries = 0;
    do { x = 150 + rand() * 5100; y = 180 + rand() * 3300; tries++; } while (tries < 12 && (isOnRoad(x, y) || G.world.hitsBuilding(x, y, 14)));
    G.peds.push({
      x, y, angle: rand() * Math.PI * 2, speed: 0, walkPhase: rand() * 6,
      color: PED_COLORS[Math.floor(rand() * PED_COLORS.length)],
      hp: 30, state: 'walk', fleeT: 0, target: null, pauseT: rand() * 3,
      skin: ['#f2c79b', '#c98d5e', '#8a5a34', '#6e4525'][Math.floor(rand() * 4)],
    });
  }
}

function pickTarget(G, p) {
  const rand = G.rand;
  for (let t = 0; t < 10; t++) {
    const x = clamp(p.x + randRange(rand, -420, 420), 40, 5360);
    const y = clamp(p.y + randRange(rand, -420, 420), 130, 3560);
    if (!G.world.hitsBuilding(x, y, 14) && !isOnRoad(x, y)) return { x, y };
  }
  return { x: p.x, y: p.y };
}

export function updatePeds(G, dt) {
  const px = G.player.car ? G.player.car.x : G.player.x;
  const py = G.player.car ? G.player.car.y : G.player.y;
  for (const p of G.peds) {
    if (p.hp <= 0) continue;
    if (dist(p.x, p.y, px, py) > 1400) continue;
    let danger = null;
    if (G.gunfireT > 0 && dist(p.x, p.y, px, py) < 300) danger = { x: px, y: py };
    if (G.player.car && Math.abs(G.player.car.speed) > 190 && dist(p.x, p.y, px, py) < 120) danger = { x: px, y: py };
    if (danger) { p.state = 'flee'; p.fleeT = 1.6; p.fleeFrom = danger; }
    if (p.state === 'flee') {
      p.fleeT -= dt;
      const a = Math.atan2(p.y - p.fleeFrom.y, p.x - p.fleeFrom.x);
      p.angle = a;
      const sp = 205;
      G.world.moveCircle(p, Math.cos(a) * sp * dt, Math.sin(a) * sp * dt, 10);
      p.walkPhase += dt * 11;
      if (p.fleeT <= 0) { p.state = 'walk'; p.target = null; }
      continue;
    }
    if (p.pauseT > 0) { p.pauseT -= dt; continue; }
    if (!p.target || dist(p.x, p.y, p.target.x, p.target.y) < 16) {
      p.target = pickTarget(G, p);
      if (G.rand() < 0.25) p.pauseT = 1 + G.rand() * 3.5;
    }
    const a = Math.atan2(p.target.y - p.y, p.target.x - p.x);
    let dA = (a - p.angle) % (Math.PI * 2);
    if (dA > Math.PI) dA -= Math.PI * 2; if (dA < -Math.PI) dA += Math.PI * 2;
    p.angle += clamp(dA, -4 * dt, 4 * dt);
    G.world.moveCircle(p, Math.cos(p.angle) * 62 * dt, Math.sin(p.angle) * 62 * dt, 10);
    p.walkPhase += dt * 6.5;
  }
}
