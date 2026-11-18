// Solstice Bay — tuning constants: world size, road grid, districts, colours, speeds.
// Everything numeric lives here so the other systems stay readable and easy to balance.
export const WORLD_W = 5400;
export const WORLD_H = 3600;
export const ROAD_XS = [260, 950, 1640, 2330, 3020, 3710, 4400, 5140];
export const ROAD_YS = [260, 920, 1580, 2240, 2900, 3340];
export const ROAD_HALF = 76;
export const VIEW_W = 1280;
export const VIEW_H = 720;

export const DISTRICTS = [
  { name: 'Coral Strand', x0: 0, y0: 0, x1: 2700, y1: 1200, tint: '#1d4a5e', ground: '#c9b189' },
  { name: 'Neon Palms', x0: 2700, y0: 0, x1: 5400, y1: 1200, tint: '#4a1e5e', ground: '#b8a888' },
  { name: 'Harbor Row', x0: 0, y0: 1200, x1: 1800, y1: 2400, tint: '#274a2e', ground: '#a8b08a' },
  { name: 'Mesa Heights', x0: 1800, y0: 1200, x1: 3600, y1: 2400, tint: '#5e3a1e', ground: '#c2a878' },
  { name: 'Saltflats Market', x0: 3600, y0: 1200, x1: 5400, y1: 2400, tint: '#5e521e', ground: '#cfc090' },
  { name: 'Old Fort', x0: 0, y0: 2400, x1: 5400, y1: 3600, tint: '#3a2e4a', ground: '#b09a7a' },
];

export const LANDMARKS = [
  { name: 'Solstice Lighthouse', x: 480, y: 300, kind: 'lighthouse' },
  { name: 'Grand Marina', x: 1300, y: 420, kind: 'marina' },
  { name: 'Skyneedle Tower', x: 3020, y: 1580, kind: 'tower' },
  { name: 'Fort Solstice', x: 950, y: 2900, kind: 'fort' },
  { name: 'Bayview Wheel', x: 4400, y: 500, kind: 'wheel' },
  { name: 'Mesa Grand Hotel', x: 2330, y: 2240, kind: 'hotel' },
];

export const BUILDING_COLORS = ['#33507a', '#5a3a6e', '#7a5233', '#2e6e5a', '#6e5a2e', '#4a3a7a', '#7a3550', '#3a607a', '#8a6a3a', '#2e5a6e'];
export const CAR_COLORS = ['#e74c3c', '#3498db', '#f5c542', '#2ecc71', '#e67e22', '#ecf0f1', '#9b59b6', '#1abc9c', '#fd79a8', '#7f8c9d', '#f39c12', '#16a085'];
export const PED_COLORS = ['#f39c12', '#e91e63', '#00bcd4', '#8bc34a', '#ff7043', '#b39dfb', '#fff176', '#81d4fa', '#ff8a65', '#aed581'];

export const PLAYER_SPEED_WALK = 155;
export const PLAYER_SPEED_RUN = 275;
export const PLAYER_RADIUS = 13;
export const MAG_SIZE = 12;
export const SAVE_KEY = 'solstice-bay-save-v2';

export const HOSPITAL = { x: 2330, y: 1580, label: 'Solstice General Hospital' };
export const POLICE_HQ = { x: 3020, y: 920, label: 'Solstice Bay Police HQ' };
export const PLAYER_START = { x: 1640, y: 1740 };
export const FIXER_HOME = { x: 1640, y: 1580, label: "Auntie Vera's Diner" };

export function districtAt(x, y) {
  for (const d of DISTRICTS) if (x >= d.x0 && x < d.x1 && y >= d.y0 && y < d.y1) return d;
  return DISTRICTS[0];
}
export function clamp(v, lo, hi) { return v < lo ? lo : v > hi ? hi : v; }
export function dist(ax, ay, bx, by) { return Math.hypot(ax - bx, ay - by); }
export function angleLerp(a, b, t) {
  let d = (b - a) % (Math.PI * 2);
  if (d > Math.PI) d -= Math.PI * 2;
  if (d < -Math.PI) d += Math.PI * 2;
  return a + d * t;
}
export function angleDiff(a, b) {
  let d = (b - a) % (Math.PI * 2);
  if (d > Math.PI) d -= Math.PI * 2;
  if (d < -Math.PI) d += Math.PI * 2;
  return d;
}
