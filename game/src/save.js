// localStorage save: player position, money, health, mission progress and story flags.
// Wrapped in try/catch — private windows simply play session-only.
import { SAVE_KEY } from './config.js';

export function saveGame(G) {
  try {
    const p = G.player;
    localStorage.setItem(SAVE_KEY, JSON.stringify({
      x: p.x, y: p.y, money: p.money, health: p.health, armor: p.armor,
      missionIndex: G.missionIndex, respect: p.respect || 0,
      taxiDone: G.stats.taxi, courierDone: G.stats.courier, racesWon: G.stats.races,
    }));
  } catch { /* storage unavailable */ }
}
export function loadGame() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}
export function clearSave() {
  try { localStorage.removeItem(SAVE_KEY); } catch { /* ignore */ }
}
