// HUD + minimap for Solstice Bay: health/armor bars, cash, wanted stars, weapon and
// ammo, mission objective text with a distance readout, dialogue boxes, centre
// messages, the BUSTED progress arc, and a minimap with player, traffic, police
// and objective blips.
import { WORLD_W, WORLD_H, clamp, dist } from './config.js';
import { starsForHeat } from './police.js';
import { currentObjective } from './missions.js';

function bar(ctx, x, y, w, h, frac, color, bg) {
  ctx.fillStyle = bg; ctx.fillRect(x, y, w, h);
  ctx.fillStyle = color; ctx.fillRect(x, y, w * clamp(frac, 0, 1), h);
  ctx.strokeStyle = 'rgba(0,0,0,0.55)'; ctx.strokeRect(x + 0.5, y + 0.5, w, h);
}

export function drawHUD(ctx, G) {
  const p = G.player;
  ctx.save();
  ctx.font = 'bold 15px system-ui, sans-serif';
  // Top-left: vitals.
  bar(ctx, 16, 14, 190, 14, p.health / 100, '#e5484d', 'rgba(20,10,10,0.65)');
  bar(ctx, 16, 32, 190, 9, p.armor / 100, '#5aa2e8', 'rgba(10,14,24,0.65)');
  ctx.fillStyle = '#fff'; ctx.textAlign = 'left';
  ctx.fillText('HP', 16, 12 + 0); // label above bar baseline handled below
  ctx.font = 'bold 20px system-ui, sans-serif';
  ctx.fillStyle = '#7CFC98';
  ctx.fillText('$' + Math.floor(p.money), 16, 68);
  ctx.font = '13px system-ui, sans-serif';
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.fillText(p.car ? p.car.def.name + `  ·  hull ${Math.max(0, Math.ceil(p.car.hp))}` : (p.weapon === 'pistol' ? `Sunshot Pistol  ·  ${p.ammo} / ${p.reserve}` : 'Fists'), 16, 88);
  ctx.fillText(G.districtName, 16, 106);

  // Top-right: wanted stars.
  const stars = starsForHeat(G.heat);
  ctx.textAlign = 'right';
  for (let i = 0; i < 5; i++) {
    ctx.font = '26px system-ui, sans-serif';
    ctx.fillStyle = i < stars ? (Math.floor(G.time * 4) % 2 && stars >= 4 ? '#ff5252' : '#ffd94a') : 'rgba(255,255,255,0.22)';
    ctx.fillText('★', 1264 - (4 - i) * 30, 34);
  }
  if (G.bustT > 0.15) {
    ctx.fillStyle = '#ff5252'; ctx.font = 'bold 17px system-ui, sans-serif';
    ctx.fillText('BUSTED?', 1264, 62);
    bar(ctx, 1074, 66, 190, 8, G.bustT / 2.4, '#ff5252', 'rgba(30,0,0,0.6)');
  }
  ctx.restore();
  drawMinimap(ctx, G);
  drawObjective(ctx, G);
  drawMessages(ctx, G);
}

function drawObjective(ctx, G) {
  const obj = currentObjective(G);
  G.objectiveCache = obj;
  const d = Math.round(dist(G.player.x, G.player.y, obj.x, obj.y));
  ctx.save();
  ctx.font = 'bold 15px system-ui, sans-serif';
  const w = Math.min(660, ctx.measureText(obj.label).width + 90);
  ctx.fillStyle = 'rgba(8,12,20,0.72)';
  ctx.fillRect(640 - w / 2, 640, w, 30);
  ctx.fillStyle = '#ffe9a0'; ctx.textAlign = 'center';
  ctx.fillText(`◎ ${obj.label}  ·  ${d}m`, 640, 660);
  ctx.restore();
  // Off-screen direction arrow at screen edge.
  const sx = obj.x - G.camera.x, sy = obj.y - G.camera.y;
  if (sx < 0 || sx > 1280 || sy < 0 || sy > 720) {
    const cx = clamp(sx, 40, 1240), cy = clamp(sy, 60, 620);
    const a = Math.atan2(sy - 360, sx - 640);
    ctx.save(); ctx.translate(cx, cy); ctx.rotate(a);
    ctx.fillStyle = '#ffe9a0';
    ctx.beginPath(); ctx.moveTo(14, 0); ctx.lineTo(-8, -8); ctx.lineTo(-8, 8); ctx.closePath(); ctx.fill();
    ctx.restore();
  }
}

function drawMessages(ctx, G) {
  ctx.save(); ctx.textAlign = 'center';
  if (G.message && G.messageT > 0) {
    ctx.font = 'bold 21px system-ui, sans-serif';
    ctx.fillStyle = 'rgba(8,12,20,0.7)';
    const w = ctx.measureText(G.message).width + 36;
    ctx.fillRect(640 - w / 2, 120, w, 38);
    ctx.fillStyle = G.messageColor || '#fff';
    ctx.fillText(G.message, 640, 147);
  }
  if (G.dialogue) {
    const line = G.dialogue.lines[G.dialogue.idx];
    ctx.fillStyle = 'rgba(6,8,14,0.88)';
    ctx.fillRect(190, 520, 900, 96);
    ctx.strokeStyle = '#c9a227'; ctx.strokeRect(190.5, 520.5, 900, 96);
    ctx.textAlign = 'left';
    ctx.font = 'bold 16px system-ui, sans-serif'; ctx.fillStyle = '#ffd94a';
    ctx.fillText(line[0], 214, 548);
    ctx.font = '16px system-ui, sans-serif'; ctx.fillStyle = '#f2f2f2';
    wrapText(ctx, line[1], 214, 574, 852, 21);
    ctx.font = '12px system-ui, sans-serif'; ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.textAlign = 'right';
    ctx.fillText('E ▸', 1066, 606);
  }
  ctx.restore();
}
function wrapText(ctx, text, x, y, maxW, lh) {
  const words = text.split(' '); let line = '', yy = y;
  for (const w of words) {
    if (ctx.measureText(line + w).width > maxW) { ctx.fillText(line, x, yy); line = ''; yy += lh; }
    line += w + ' ';
  }
  ctx.fillText(line, x, yy);
}

function drawMinimap(ctx, G) {
  const MW = 196, MH = 132, MX = 1068, MY = 470;
  const sx = MW / WORLD_W, sy = MH / WORLD_H;
  ctx.save();
  ctx.fillStyle = 'rgba(10,16,24,0.85)'; ctx.fillRect(MX, MY, MW, MH);
  ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.strokeRect(MX + 0.5, MY + 0.5, MW, MH);
  ctx.fillStyle = '#2b4a63'; ctx.fillRect(MX, MY, MW, 96 * sy + 2); // bay
  const blip = (x, y, color, r) => { ctx.fillStyle = color; ctx.beginPath(); ctx.arc(MX + x * sx, MY + y * sy, r, 0, 7); ctx.fill(); };
  for (const c of G.traffic) blip(c.x, c.y, 'rgba(200,200,200,0.55)', 1.6);
  for (const c of G.policeCars) blip(c.x, c.y, Math.floor(G.time * 3) % 2 ? '#ff5252' : '#5aa2e8', 2.4);
  const obj = G.objectiveCache;
  if (obj) blip(obj.x, obj.y, '#ffe9a0', 3.4);
  // Player arrow.
  const p = G.player;
  ctx.translate(MX + p.x * sx, MY + p.y * sy); ctx.rotate(p.angle);
  ctx.fillStyle = '#fff';
  ctx.beginPath(); ctx.moveTo(5, 0); ctx.lineTo(-4, -3.4); ctx.lineTo(-4, 3.4); ctx.closePath(); ctx.fill();
  ctx.restore();
  ctx.save(); ctx.font = '11px system-ui, sans-serif'; ctx.fillStyle = 'rgba(255,255,255,0.75)'; ctx.textAlign = 'right';
  ctx.fillText('SOLSTICE BAY', 1264, 618); ctx.restore();
}
