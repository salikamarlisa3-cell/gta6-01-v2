// SOLSTICE BAY — hand-in program for the make.fun "gta6-01" bounty (Node 22, stdlib only).
//
// The game itself is the static site in game/: open game/index.html in desktop Chrome and
// Solstice Bay plays fully offline — a top-down open-world crime game with a six-mission
// story, five vehicle classes, traffic, pedestrians, a 0-5 star police system, side jobs
// (taxi, courier, checkpoint sprints, vigilante), a day-night cycle and a localStorage
// save. All art is drawn with canvas code and all sound is synthesized WebAudio, so the
// folder needs no build step and makes no network requests.
//
// This program copies game/ and screenshots/ into the output directory and writes
// dossier.json there using buildDossier from the vendored make.fun library, passing the
// scorer's caps so an entry the scorer would refuse also fails here first.
//
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts     (local check)
//   node main.ts                                            (hands in to /output)

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const repoRoot = fileURLToPath(new URL('.', import.meta.url));
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(outputDir, { recursive: true });
cpSync(join(repoRoot, 'game'), join(outputDir, 'game'), { recursive: true });
mkdirSync(join(outputDir, 'screenshots'), { recursive: true });
if (existsSync(join(repoRoot, 'screenshots'))) {
  cpSync(join(repoRoot, 'screenshots'), join(outputDir, 'screenshots'), { recursive: true });
}

const dossier = buildDossier(outputDir, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
  game_path_max_bytes: 1000,
});
writeFileSync(join(outputDir, 'dossier.json'), dossier);
console.log(`Solstice Bay handed in: ${outputDir}/dossier.json (${dossier.length} bytes)`);
