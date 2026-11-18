// Ambient traffic for Solstice Bay: cars pick a lane on the road grid, follow it,
// turn at intersections, brake for obstacles ahead and honk when blocked. Parked
// cars fill the kerbs and can be stolen by the player.
import { ROAD_XS, ROAD_YS, ROAD_HALF, CAR_COLORS, clamp, dist } from './config.js';
import { isOnRoadY } from './world.js';
import { createCar, TRAFFIC_KINDS } from './vehicles.js';

const LANE = 34;

export function spawnTraffic(G) {
  const rand = G.rand;
  G.traffic = [];
  G.parked = [];
  for (let i = 0; i < 26; i++) {
    const vertical = rand() > 0.45;
    const kind = TRAFFIC_KINDS[Math.floor(rand() * TRAFFIC_KINDS.length)];
    let car;
    if (vertical) {
      const rx = ROAD_XS[Math.floor(rand() * ROAD_XS.length)];
      const dir = rand() > 0.5 ? 1 : -1;
      car = createCar(rx + dir * LANE, 200 + rand() * 3200, dir > 0 ? Math.PI / 2 : -Math.PI / 2, kind, CAR_COLORS[Math.floor(rand() * CAR_COLORS.length)]);
      car.ai = { axis: 'y', line: rx, dir };
    } else {
      const ry = ROAD_YS[Math.floor(rand() * ROAD_YS.length)];
      const dir = rand() > 0.5 ? 1 : -1;
      car = createCar(200 + rand() * 5000, ry + (dir > 0 ? -LANE : LANE), dir > 0 ? 0 : Math.PI, kind, CAR_COLORS[Math.floor(rand() * CAR_COLORS.length)]);
      car.ai = { axis: 'x', line: ry, dir };
    }
    car.speed = car.def.topSpeed * (0.42 + rand() * 0.2);
    car.cruise = car.speed;
    G.traffic.push(car);
  }
  const spots = [...G.world.parkSpots];
  for (let i = 0; i < 22 && spots.length; i++) {
    const idx = Math.floor(rand() * spots.length);
    const s = spots.splice(idx, 1)[0];
    const kind = TRAFFIC_KINDS[Math.floor(rand() * 5)];
    G.parked.push(createCar(s.x, s.y, s.angle, kind, CAR_COLORS[Math.floor(rand() * CAR_COLORS.length)]));
  }
}

function obstacleAhead(G, car) {
  const fx = car.x + Math.cos(car.angle) * (car.len / 2 + 42);
  const fy = car.y + Math.sin(car.angle) * (car.len / 2 + 42);
  const all = [...G.traffic, ...G.policeCars];
  if (G.player.car) all.push(G.player.car);
  for (const o of all) {
    if (o === car) continue;
    if (dist(fx, fy, o.x, o.y) < 34) return o;
  }
  if (!G.player.car && dist(fx, fy, G.player.x, G.player.y) < 26) return G.player;
  for (const p of G.peds) if (dist(fx, fy, p.x, p.y) < 22) return p;
  return null;
}

export function updateTraffic(G, dt) {
  const rand = G.rand;
  for (const car of G.traffic) {
    if (car.hp <= 0) { car.speed = 0; continue; }
    if (dist(car.x, car.y, G.player.x, G.player.y) > 1500) continue; // sleep far traffic
    const ai = car.ai;
    // At an intersection, sometimes turn onto the crossing road.
    const onCrossX = ROAD_XS.some((rx) => Math.abs(car.x - rx) < 10);
    const onCrossY = ROAD_YS.some((ry) => Math.abs(car.y - ry) < 10);
    if (ai.axis === 'y' && onCrossY && rand() < dt * 0.55) {
      const ry = ROAD_YS.reduce((b, v) => (Math.abs(v - car.y) < Math.abs(b - car.y) ? v : b), ROAD_YS[0]);
      ai.axis = 'x'; ai.line = ry; ai.dir = rand() > 0.5 ? 1 : -1;
    } else if (ai.axis === 'x' && onCrossX && rand() < dt * 0.55) {
      const rx = ROAD_XS.reduce((b, v) => (Math.abs(v - car.x) < Math.abs(b - car.x) ? v : b), ROAD_XS[0]);
      ai.axis = 'y'; ai.line = rx; ai.dir = rand() > 0.5 ? 1 : -1;
    }
    let targetAngle, lanePos;
    if (ai.axis === 'y') { targetAngle = ai.dir > 0 ? Math.PI / 2 : -Math.PI / 2; lanePos = ai.line + ai.dir * LANE; car.x += clamp(lanePos - car.x, -60 * dt, 60 * dt); }
    else { targetAngle = ai.dir > 0 ? 0 : Math.PI; lanePos = ai.line + (ai.dir > 0 ? -LANE : LANE); car.y += clamp(lanePos - car.y, -60 * dt, 60 * dt); }
    let dA = (targetAngle - car.angle) % (Math.PI * 2);
    if (dA > Math.PI) dA -= Math.PI * 2; if (dA < -Math.PI) dA += Math.PI * 2;
    car.angle += clamp(dA, -2.4 * dt, 2.4 * dt);

    const blocked = obstacleAhead(G, car);
    let target = car.cruise;
    if (blocked) {
      target = 0;
      if (car.honkCd <= 0 && Math.abs(car.speed) < 12) { car.honkCd = 2.2; if (dist(car.x, car.y, G.player.x, G.player.y) < 420) G.audio.horn(); }
    }
    if (car.speed < target) car.speed = Math.min(target, car.speed + car.def.accel * 0.7 * dt);
    else car.speed = Math.max(target, car.speed - 480 * dt);
    car.brakeLight = blocked != null;
    const nx = car.x + Math.cos(car.angle) * car.speed * dt;
    const ny = car.y + Math.sin(car.angle) * car.speed * dt;
    if (!G.world.carBlocked(nx, ny, car.angle, car.len, car.wid)) { car.x = nx; car.y = ny; }
    else { car.speed = 0; ai.dir *= -1; }
    if (car.honkCd > 0) car.honkCd -= dt;
    // Wrap cars that leave the map back onto their road.
    if (car.x < 60 || car.x > 5340 || car.y < 130 || car.y > 3540) {
      if (ai.axis === 'y') { car.y = ai.dir > 0 ? 200 : 3400; } else { car.x = ai.dir > 0 ? 200 : 5200; }
    }
  }
  void isOnRoadY;
}
