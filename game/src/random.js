// Seeded RNG (mulberry32): the same seed always builds the same city and the same
// screenshot scenes, which is what makes ?seed=7 renders reproducible for the judges.
export function createRandom(seed) {
  let a = (seed | 0) || 1;
  return function nextRandom() {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
export function pickFrom(rand, list) { return list[Math.floor(rand() * list.length) % list.length]; }
export function randRange(rand, lo, hi) { return lo + rand() * (hi - lo); }
