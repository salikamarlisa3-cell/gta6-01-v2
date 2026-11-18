// Combat for Solstice Bay: fists, a mouse-aimed pistol with tracers and muzzle flash,
// reloads, armor soaking damage, ped/cop casualties and the heat they bring.
import { MAG_SIZE, dist } from './config.js';
import { addHeat, starsForHeat } from './police.js';
import { ACT_RELOAD, ACT_WEAPON } from './input.js';

export function spawnBulletFx(G, x1, y1, x2, y2) {
  G.tracers.push({ x1, y1, x2, y2, t: 0.07 });
  G.particles.push({ x: x2, y: y2, vx: 0, vy: 0, t: 0.12, color: '#ffe9a0', r: 3 });
}

export function damagePlayer(G, amount) {
  const p = G.player;
  if (p.armor > 0) { const soak = Math.min(p.armor, amount * 0.65); p.armor -= soak; amount -= soak; }
  p.health -= amount; p.hurtT = 0.35;
  if (p.health <= 0 && G.screen === 'play') G.wasted();
}

function nearestTargetInCone(G, range, cone) {
  const p = G.player;
  let best = null, bd = range;
  for (const ped of G.peds) {
    if (ped.hp <= 0) continue;
    const d = dist(p.x, p.y, ped.x, ped.y);
    if (d > bd) continue;
    const a = Math.atan2(ped.y - p.y, ped.x - p.x);
    let da = Math.abs((a - p.angle) % (Math.PI * 2));
    if (da > Math.PI) da = Math.PI * 2 - da;
    if (da < cone) { bd = d; best = ped; }
  }
  return best;
}

export function updateCombat(G, dt) {
  const p = G.player;
  if (G.gunfireT > 0) G.gunfireT -= dt;
  for (let i = G.tracers.length - 1; i >= 0; i--) { G.tracers[i].t -= dt; if (G.tracers[i].t <= 0) G.tracers.splice(i, 1); }
  for (let i = G.particles.length - 1; i >= 0; i--) {
    const q = G.particles[i]; q.t -= dt; q.x += q.vx * dt; q.y += q.vy * dt;
    if (q.t <= 0) G.particles.splice(i, 1);
  }
  if (p.car) return; // no shooting from the driver's seat in this build

  const actions = G.input.peekActions();
  if (actions & ACT_WEAPON) { G.input.takeActions(); p.weapon = p.weapon === 'fist' ? 'pistol' : 'fist'; G.audio.ui(); }
  if ((actions & ACT_RELOAD) && p.weapon === 'pistol') {
    G.input.takeActions();
    const need = MAG_SIZE - p.ammo, take = Math.min(need, p.reserve);
    p.ammo += take; p.reserve -= take; G.audio.ui();
  }

  // Melee: click or J with fists.
  if ((G.input.mouse.down || G.input.down('KeyJ')) && p.weapon === 'fist' && p.punchCd <= 0) {
    p.punchCd = 0.34;
    G.audio.punch();
    const t = nearestTargetInCone(G, 44, 1.1);
    if (t) {
      t.hp -= 16; t.state = 'flee'; t.fleeT = 2; t.fleeFrom = { x: p.x, y: p.y };
      addHeat(G, 5, p.x, p.y);
      for (let k = 0; k < 4; k++) G.particles.push({ x: t.x, y: t.y, vx: (G.rand() - 0.5) * 90, vy: (G.rand() - 0.5) * 90, t: 0.3, color: '#ffffff', r: 2 });
      if (t.hp <= 0) { addHeat(G, 16, p.x, p.y); G.flashMessage('You knocked someone out cold.', '#ffb3b3'); }
    }
  }

  // Pistol: hold mouse to fire toward the cursor.
  if (G.input.mouse.down && p.weapon === 'pistol' && p.fireCd <= 0) {
    if (p.ammo <= 0) { p.fireCd = 0.3; G.audio.ui(); G.flashMessage('Out of ammo — press R to reload.', '#ffd28a'); }
    else {
      p.fireCd = 0.19; p.ammo--; G.gunfireT = 0.5;
      G.audio.shot();
      addHeat(G, 3.5, p.x, p.y);
      const range = 430;
      const tx = p.x + Math.cos(p.angle) * range, ty = p.y + Math.sin(p.angle) * range;
      let hitX = tx, hitY = ty, bestD = range;
      const test = (ox, oy, r) => {
        // distance from point to the shot ray
        const vx = Math.cos(p.angle), vy = Math.sin(p.angle);
        const dx = ox - p.x, dy = oy - p.y;
        const along = dx * vx + dy * vy;
        if (along < 0 || along > bestD) return -1;
        const perp = Math.abs(dx * vy - dy * vx);
        return perp <= r ? along : -1;
      };
      for (const ped of G.peds) {
        if (ped.hp <= 0) continue;
        const a = test(ped.x, ped.y, 13);
        if (a >= 0) { bestD = a; hitX = ped.x; hitY = ped.y; var hitPed = ped; }
      }
      for (const car of [...G.traffic, ...G.policeCars, ...G.parked]) {
        const a = test(car.x, car.y, car.wid);
        if (a >= 0 && a < bestD) { bestD = a; hitX = car.x; hitY = car.y; hitPed = null; car.hp -= 22; }
      }
      spawnBulletFx(G, p.x + Math.cos(p.angle) * 18, p.y + Math.sin(p.angle) * 18, hitX, hitY);
      if (typeof hitPed !== 'undefined' && hitPed) {
        hitPed.hp -= 34;
        hitPed.state = 'flee'; hitPed.fleeT = 2.4; hitPed.fleeFrom = { x: p.x, y: p.y };
        if (hitPed.hp <= 0) { addHeat(G, 22, p.x, p.y); G.flashMessage('Witnesses are calling the SBPD!', '#ffb3b3'); }
      }
      if (G.world.hitsBuilding(hitX, hitY, 2) && bestD >= range - 1) { /* wall hit fx only */ }
    }
  }
  // Cops shoot back at 3+ stars when close and the player is on foot.
  if (starsForHeat(G.heat) >= 3 && G.rand() < dt * 0.8) {
    for (const c of G.policeCars) {
      if (dist(c.x, c.y, p.x, p.y) < 300) { damagePlayer(G, 4 + G.rand() * 5); spawnBulletFx(G, c.x, c.y, p.x, p.y); G.audio.shot(); break; }
    }
  }
}
