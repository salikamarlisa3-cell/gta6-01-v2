// City generation for Solstice Bay: a 5400x3600 coastal grid (twice the area of our
// first city) with six districts, a beach and bay along the north edge, landmarks,
// buildings with collision, props, parked-car spots and movement helpers.
import { WORLD_W, WORLD_H, ROAD_XS, ROAD_YS, ROAD_HALF, BUILDING_COLORS, LANDMARKS, districtAt } from './config.js';

export function isOnRoadX(x) { return ROAD_XS.some((rx) => Math.abs(x - rx) <= ROAD_HALF); }
export function isOnRoadY(y) { return ROAD_YS.some((ry) => Math.abs(y - ry) <= ROAD_HALF); }
export function isOnRoad(x, y) { return isOnRoadX(x) || isOnRoadY(y); }
export function nearestRoadX(x) { let b = ROAD_XS[0]; for (const rx of ROAD_XS) if (Math.abs(rx - x) < Math.abs(b - x)) b = rx; return b; }
export function nearestRoadY(y) { let b = ROAD_YS[0]; for (const ry of ROAD_YS) if (Math.abs(ry - y) < Math.abs(b - y)) b = ry; return b; }
export function isWater(x, y) { return y < 96; }
export { districtAt, LANDMARKS };

export function createWorld(rand) {
  const buildings = [];
  const props = [];
  const parkSpots = [];

  for (let bi = 0; bi < ROAD_XS.length - 1; bi++) {
    for (let bj = 0; bj < ROAD_YS.length - 1; bj++) {
      const bx0 = ROAD_XS[bi] + ROAD_HALF + 28;
      const bx1 = ROAD_XS[bi + 1] - ROAD_HALF - 28;
      const by0 = ROAD_YS[bj] + ROAD_HALF + 28;
      const by1 = ROAD_YS[bj + 1] - ROAD_HALF - 28;
      const bw = bx1 - bx0, bh = by1 - by0;
      if (bw < 60 || bh < 60) continue;
      const cols = bw > 330 ? 2 : 1;
      const rows = bh > 330 ? 2 : 1;
      for (let cx = 0; cx < cols; cx++) {
        for (let cy = 0; cy < rows; cy++) {
          const pad = 13;
          const x = bx0 + (bw / cols) * cx + pad;
          const y = by0 + (bh / rows) * cy + pad;
          const w = bw / cols - pad * 2 - rand() * 26;
          const h = bh / rows - pad * 2 - rand() * 26;
          buildings.push({
            x, y, w, h,
            color: BUILDING_COLORS[Math.floor(rand() * BUILDING_COLORS.length)],
            floors: 3 + Math.floor(rand() * 11),
            district: districtAt(x + w / 2, y + h / 2).name,
            roof: rand() > 0.5 ? 'flat' : 'trim',
          });
        }
      }
      props.push({ kind: 'palm', x: bx0 - 9, y: by0 - 9 });
      props.push({ kind: 'lamp', x: bx1 + 9, y: by0 - 9 });
      props.push({ kind: 'palm', x: bx1 + 9, y: by1 + 9 });
      props.push({ kind: 'lamp', x: bx0 - 9, y: by1 + 9 });
      if (rand() > 0.45) props.push({ kind: 'bench', x: bx0 + bw / 2, y: by0 - 10 });
    }
  }
  for (const rx of ROAD_XS) for (let y = 150; y < WORLD_H; y += 250) props.push({ kind: 'lamp', x: rx - ROAD_HALF - 11, y });
  for (const ry of ROAD_YS) for (let x = 150; x < WORLD_W; x += 250) props.push({ kind: 'lamp', x, y: ry - ROAD_HALF - 11 });
  for (let x = 140; x < WORLD_W; x += 210) props.push({ kind: 'palm', x, y: 118 });

  for (const rx of ROAD_XS) {
    for (let y = 200; y < WORLD_H - 110; y += 185) {
      if (isOnRoadY(y)) continue;
      parkSpots.push({ x: rx - ROAD_HALF + 24, y, angle: -Math.PI / 2 });
      parkSpots.push({ x: rx + ROAD_HALF - 24, y: y + 88, angle: Math.PI / 2 });
    }
  }

  function hitsBuilding(x, y, r) {
    for (const b of buildings) {
      if (x + r > b.x && x - r < b.x + b.w && y + r > b.y && y - r < b.y + b.h) return b;
    }
    return null;
  }
  function moveCircle(pos, dx, dy, r) {
    const nx = pos.x + dx;
    if (!hitsBuilding(nx, pos.y, r) && nx > r && nx < WORLD_W - r && !isWater(nx, pos.y)) pos.x = nx;
    const ny = pos.y + dy;
    if (!hitsBuilding(pos.x, ny, r) && ny > r + 10 && ny < WORLD_H - r) pos.y = ny;
  }
  function carBlocked(x, y, angle, len, wid) {
    const c = Math.cos(angle), s = Math.sin(angle);
    const pts = [[0, 0], [len / 2, wid / 2], [len / 2, -wid / 2], [-len / 2, wid / 2], [-len / 2, -wid / 2]];
    for (const [lx, ly] of pts) {
      const wx = x + lx * c - ly * s, wy = y + lx * s + ly * c;
      if (wx < 8 || wx > WORLD_W - 8 || wy < 104 || wy > WORLD_H - 8) return true;
      if (hitsBuilding(wx, wy, 2)) return true;
    }
    return false;
  }
  return { buildings, props, parkSpots, hitsBuilding, moveCircle, carBlocked, width: WORLD_W, height: WORLD_H };
}
