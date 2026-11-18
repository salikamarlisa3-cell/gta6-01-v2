// Deterministic showcase scenes for screenshots: ?scene=cover|drive|chase|mission&seed=7.
// Each scene arranges the real game state (no faked rendering), then sceneStep runs a
// tiny autopilot so the frozen frame still looks alive: traffic rolling, peds walking.
import { createCar, stepCar } from './vehicles.js';
import { MISSIONS } from './missions.js';
import { addHeat } from './police.js';

export function setupScene(G, name) {
  const p = G.player;
  if (name === 'cover') {
    G.timeOfDay = 0.44;
    p.x = 1300; p.y = 640; p.angle = -0.5;
    p.weapon = 'pistol'; p.ammo = 12;
    G.camera.x = p.x - 640; G.camera.y = p.y - 360;
  } else if (name === 'drive') {
    G.timeOfDay = 0.55;
    const car = createCar(3020 + 34, 700, Math.PI / 2, 'sports', '#e74c3c');
    p.car = car; car.driver = 'player'; p.x = car.x; p.y = car.y; p.angle = car.angle;
    G.sceneCar = car;
    // Stage nearby traffic on the same avenue so the driving frame feels busy.
    const near = [[3020 - 34, 420, 'sedan', '#3498db', -1], [3020 + 34, 1180, 'compact', '#f5c542', 1], [3020 - 34, 150, 'pickup', '#7f8c9d', -1]];
    for (const [x, y, kind, color, dir] of near) {
      const t = createCar(x, y, dir > 0 ? Math.PI / 2 : -Math.PI / 2, kind, color);
      t.ai = { axis: 'y', line: 3020, dir }; t.cruise = 150; t.speed = 150;
      G.traffic.push(t);
    }
  } else if (name === 'chase') {
    G.timeOfDay = 0.78;
    const car = createCar(2330 + 34, 1200, Math.PI / 2, 'sports', '#f5c542');
    p.car = car; car.driver = 'player'; p.x = car.x; p.y = car.y; p.angle = car.angle;
    G.sceneCar = car;
    addHeat(G, 88, car.x, car.y);
    G.lastSeen = { x: car.x, y: car.y };
    for (let i = 0; i < 3; i++) {
      const cop = createCar(car.x - 60 + i * 55, car.y - 190 - i * 60, Math.PI / 2, 'police');
      cop.isPolice = true; cop.speed = 260;
      G.policeCars.push(cop);
    }
  } else if (name === 'mission') {
    G.timeOfDay = 0.5;
    p.x = 1640; p.y = 1660; p.angle = -Math.PI / 2;
    G.missionIndex = 2;
    G.mission = { index: 2, step: 0 };
    G.showDialogue(MISSIONS[2].intro);
    p.money = 390;
  }
  G.screen = 'play';
}

export function sceneStep(G, dt) {
  // Drive the showcase car straight down its lane with gentle corrections.
  const car = G.sceneCar;
  if (car) {
    const laneX = Math.round((car.x - 34) / 10) * 10;
    void laneX;
    const steer = Math.max(-0.4, Math.min(0.4, (Math.cos(car.angle) * 0 + (car.angle - Math.PI / 2)) * -1.4));
    stepCar(car, { throttle: 0.75, steer, brake: false }, G.world, dt);
    G.player.x = car.x; G.player.y = car.y; G.player.angle = car.angle;
    if (G.sceneName === 'chase') { G.heat = Math.max(G.heat, 80); G.lastSeen = { x: car.x, y: car.y }; G.seenT = 0; }
  }
}
