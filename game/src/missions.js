// Story chain for Solstice Bay: six missions for fixer Auntie Vera, who runs the
// Coral Strand diner and half the bay's quiet business. Dario Solano — broke boat
// mechanic, good driver, bad luck — works his way from grocery runs to the night
// the Solstice Diamond changes hands. Each mission is a list of steps with a
// target, HUD objective text and short dialogue beats.
import { FIXER_HOME, HOSPITAL, POLICE_HQ, dist } from './config.js';
import { addHeat } from './police.js';

export const MISSIONS = [
  {
    title: 'First Shift',
    intro: [["Vera", "Dario! You still owe me for the boat parts, so listen good."], ["Vera", "Take my hatchback outside and fetch groceries from Saltflats Market. Quick, quiet."], ["Dario", "Groceries. Sure, Vera. Totally normal groceries."]],
    steps: [
      { type: 'goto', x: 3900, y: 1700, label: 'Drive to Saltflats Market', needCar: false },
      { type: 'goto', x: FIXER_HOME.x, y: FIXER_HOME.y + 120, label: "Bring the groceries back to Vera's diner", needCar: false },
    ],
    reward: 150,
    outro: [["Vera", "See? Easy money. You drive clean, Dario. I like clean."]],
  },
  {
    title: 'Package for the Marina',
    intro: [["Vera", "A friend at the Grand Marina needs a package. No names, no questions."], ["Dario", "The less I know, the better I sleep."]],
    steps: [
      { type: 'goto', x: 1300, y: 560, label: 'Deliver the package to the Grand Marina', needCar: false },
      { type: 'goto', x: 260, y: 1000, label: 'Drop the payment at the Coral Strand safehouse', needCar: false },
    ],
    reward: 240,
    outro: [["Vera", "Paid in full. People are starting to ask about my new driver."]],
  },
  {
    title: 'Hot Wheels',
    intro: [["Vera", "A Vyper GT in Neon Palms has... paperwork problems. Bring it to the Mesa garage."], ["Dario", "You mean steal it."], ["Vera", "I mean RELOCATE it, baby."]],
    steps: [
      { type: 'goto', x: 4400, y: 920, label: 'Find the Vyper GT in Neon Palms', needCar: false },
      { type: 'goto', x: 2330, y: 2400, label: 'Deliver the car to the Mesa Heights garage', needCar: true, heat: 18 },
    ],
    reward: 420,
    outro: [["Vera", "Beautiful. The garage boys will change everything but the smell."]],
  },
  {
    title: 'Night Courier',
    intro: [["Vera", "Hospital run. Medicine for a man who cannot be seen at Solstice General."], ["Vera", "Pick it up at Harbor Row, drop it at the Old Fort clinic. After dark, nobody follows you. Right?"]],
    steps: [
      { type: 'goto', x: 950, y: 1900, label: 'Pick up the medicine in Harbor Row', needCar: false },
      { type: 'goto', x: 950, y: 3050, label: 'Deliver to the Old Fort clinic', needCar: false, heat: 10 },
    ],
    reward: 550,
    outro: [["Vera", "He lives. You get paid. The bay stays balanced."]],
  },
  {
    title: 'Heat Wave',
    intro: [["Vera", "The SBPD raided my Saltflats warehouse. My ledger is still inside a Mule pickup."], ["Vera", "Get the truck out and lose the heat, THEN bring it home. Do not lead them to my door!"]],
    steps: [
      { type: 'goto', x: 4400, y: 2050, label: 'Recover the Mule pickup at Saltflats', needCar: false, heat: 34 },
      { type: 'escape', x: 0, y: 0, label: 'Lose the police (break line of sight)', needCar: false },
      { type: 'goto', x: FIXER_HOME.x, y: FIXER_HOME.y + 120, label: "Return the truck to Vera's diner", needCar: false },
    ],
    reward: 800,
    outro: [["Vera", "That ledger stays buried, and so does this whole night. Good work."]],
  },
  {
    title: 'The Solstice Diamond',
    intro: [["Vera", "Final job, Dario. The Solstice Diamond leaves the Mesa Grand Hotel tonight."], ["Vera", "Lift it, run it to the lighthouse, and my boat takes it — and you — out of the bay rich."]],
    steps: [
      { type: 'goto', x: 2330, y: 2300, label: 'Take the diamond from the Mesa Grand Hotel', needCar: false, heat: 42 },
      { type: 'goto', x: 480, y: 400, label: 'Run the diamond to the Solstice Lighthouse', needCar: false },
      { type: 'escape', x: 0, y: 0, label: 'Shake the SBPD before the boat leaves', needCar: false },
    ],
    reward: 2500,
    outro: [["Vera", "There she goes... and there YOU go, Dario Solano. Rich, free, and never bored again."], ["Dario", "Solstice Bay... I'm gonna miss the trouble. THE END — free roam unlocked!"]],
  },
];

export function currentObjective(G) {
  if (G.mission) {
    const m = MISSIONS[G.mission.index];
    const s = m.steps[G.mission.step];
    return { x: s.x, y: s.y, label: `${m.title}: ${s.label}`, mission: true };
  }
  if (G.activity && G.activity.objective) return G.activity.objective;
  if (G.missionIndex < MISSIONS.length) return { x: FIXER_HOME.x, y: FIXER_HOME.y, label: `Go see Auntie Vera — Mission ${G.missionIndex + 1}: ${MISSIONS[G.missionIndex].title}`, mission: false };
  return { x: HOSPITAL.x, y: HOSPITAL.y, label: 'Free roam: taxi (T), courier (C), races (R), vigilante (V) — earn your fortune.', mission: false };
}

export function tryStartMission(G) {
  if (G.mission || G.missionIndex >= MISSIONS.length) return false;
  if (dist(G.player.x, G.player.y, FIXER_HOME.x, FIXER_HOME.y) > 90 || G.player.car) return false;
  const index = G.missionIndex;
  G.mission = { index, step: 0 };
  G.showDialogue(MISSIONS[index].intro);
  G.audio.ui();
  return true;
}

export function updateMissions(G, dt) {
  if (!G.mission) return;
  const m = MISSIONS[G.mission.index];
  const s = m.steps[G.mission.step];
  if (s.type === 'escape') {
    if (G.heat <= 0) advanceStep(G, m);
    return;
  }
  const px = G.player.car ? G.player.car.x : G.player.x;
  const py = G.player.car ? G.player.car.y : G.player.y;
  if (dist(px, py, s.x, s.y) < 78 && (!s.needCar || G.player.car)) {
    if (s.heat) addHeat(G, s.heat, px, py);
    G.audio.pickup();
    advanceStep(G, m);
  }
  void dt;
}

function advanceStep(G, m) {
  G.mission.step++;
  if (G.mission.step >= m.steps.length) {
    G.player.money += m.reward;
    G.player.respect += 10;
    G.missionIndex++;
    G.mission = null;
    G.showDialogue(m.outro);
    G.flashMessage(`Mission complete: ${m.title} — +$${m.reward}`, '#7CFC98');
    G.audio.complete();
    if (G.missionIndex >= MISSIONS.length) G.flashMessage('STORY COMPLETE — Solstice Bay is yours. Free roam!', '#ffe9a0');
    G.save();
  } else {
    G.flashMessage('Objective updated.', '#aee2ff');
  }
}
export { POLICE_HQ };
