// Vehicle definitions and arcade driving physics for Solstice Bay. Five original
// classes — compact, sedan, sports coupe, pickup and motorcycle — each with its own
// size, top speed, acceleration, grip and durability.
export const VEHICLE_TYPES = {
  compact: { name: 'Pico Hatch', len: 40, wid: 21, topSpeed: 300, accel: 300, grip: 7.5, hp: 90, color: '#f5c542' },
  sedan: { name: 'Regal Sedan', len: 48, wid: 23, topSpeed: 345, accel: 320, grip: 7, hp: 120, color: '#3498db' },
  sports: { name: 'Vyper GT Coupe', len: 50, wid: 24, topSpeed: 470, accel: 460, grip: 8.5, hp: 100, color: '#e74c3c' },
  pickup: { name: 'Mule Pickup', len: 54, wid: 26, topSpeed: 315, accel: 280, grip: 6, hp: 170, color: '#7f8c9d' },
  moto: { name: 'Dart Motorcycle', len: 30, wid: 12, topSpeed: 430, accel: 480, grip: 10, hp: 55, color: '#1abc9c' },
  taxi: { name: 'SolCab Taxi', len: 48, wid: 23, topSpeed: 340, accel: 320, grip: 7, hp: 120, color: '#f39c12' },
  police: { name: 'SBPD Interceptor', len: 50, wid: 24, topSpeed: 430, accel: 420, grip: 8.5, hp: 160, color: '#eef1f5' },
};
export const TRAFFIC_KINDS = ['compact', 'sedan', 'sports', 'pickup', 'moto', 'taxi'];

let nextCarId = 1;
export function createCar(x, y, angle, kind, color) {
  const def = VEHICLE_TYPES[kind] || VEHICLE_TYPES.sedan;
  return {
    id: nextCarId++, kind, def, x, y, angle, speed: 0, steer: 0,
    len: def.len, wid: def.wid, color: color || def.color,
    hp: def.hp, maxHp: def.hp, driver: null, honkCd: 0, brakeLight: false,
  };
}

// Advance one car. ctrl = {throttle:-1..1, steer:-1..1, brake}. Returns true if it hit something solid.
export function stepCar(car, ctrl, world, dt) {
  const def = car.def;
  const accel = ctrl.throttle > 0 ? def.accel : def.accel * 0.55;
  if (ctrl.brake) {
    car.speed -= Math.sign(car.speed) * Math.min(Math.abs(car.speed), 620 * dt);
  } else {
    car.speed += ctrl.throttle * accel * dt;
  }
  car.speed -= car.speed * 0.55 * dt; // drag
  car.speed = Math.max(-def.topSpeed * 0.38, Math.min(def.topSpeed, car.speed));
  if (Math.abs(car.speed) < 2 && ctrl.throttle === 0) car.speed = 0;
  const steerTarget = ctrl.steer * (car.kind === 'moto' ? 0.62 : 0.5);
  car.steer += (steerTarget - car.steer) * Math.min(1, def.grip * dt);
  if (car.speed !== 0) {
    car.angle += car.steer * (car.speed / Math.max(46, def.len * 1.6)) * dt * 2.4;
  }
  const nx = car.x + Math.cos(car.angle) * car.speed * dt;
  const ny = car.y + Math.sin(car.angle) * car.speed * dt;
  if (world.carBlocked(nx, ny, car.angle, car.len, car.wid)) {
    if (Math.abs(car.speed) > 130) car.hp -= Math.abs(car.speed) * 0.05;
    car.speed *= -0.22;
    return true;
  }
  car.x = nx; car.y = ny;
  car.brakeLight = !!ctrl.brake || ctrl.throttle < 0;
  if (car.honkCd > 0) car.honkCd -= dt;
  return false;
}

export function carCorners(car) {
  const c = Math.cos(car.angle), s = Math.sin(car.angle);
  const hl = car.len / 2, hw = car.wid / 2;
  return [
    [car.x + hl * c - hw * s, car.y + hl * s + hw * c],
    [car.x + hl * c + hw * s, car.y + hl * s - hw * c],
    [car.x - hl * c - hw * s, car.y - hl * s + hw * c],
    [car.x - hl * c + hw * s, car.y - hl * s - hw * c],
  ];
}
export function pointInCar(px, py, car) {
  const dx = px - car.x, dy = py - car.y;
  const c = Math.cos(-car.angle), s = Math.sin(-car.angle);
  const lx = dx * c - dy * s, ly = dx * s + dy * c;
  return Math.abs(lx) <= car.len / 2 && Math.abs(ly) <= car.wid / 2;
}
