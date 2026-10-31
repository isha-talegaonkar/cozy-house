import { SEASONS, WEATHER, onSeason, onWeather, setSeason, setWeather, weather } from './season.js';
import { camTarget, camera, rotateView, zoomBy } from './scene.js';
import { CAT_ICON, CAT_LABEL, SPOTS } from './activities.js';
import { ROOM_NAME, roomOf } from './nav.js';
import { cats, command, hooks, likes, people } from './sim.js';
import { cycleSpeed, simT, speed } from './clock.js';

// ---------------------------------------------------------------- player choices (dropdown per character)
const MENU = [
  ['Together', [['T:cook', '🍲 Cook together'], ['T:eat', '🥣 Eat together'], ['T:movie', '🍿 Movie night'], ['T:walk', '🚶 Walk together'], ['T:bench', '🌅 Sit in the garden together'], ['T:patio', '☕ Tea on the patio'], ['T:sleep', '💤 Go to bed']]],
  ['Creative', [['paint', '🎨 Paint'], ['crochet', '🧶 Crochet'], ['draw', '✏️ Sketch'], ['knit', '🧶 Knit'], ['bake', '🧁 Bake']]],
  ['Fun', [['games', '🎮 Video games'], ['football', '⚽ Watch football']]],
  ['Cozy', [['read', '📖 Read by the fire'], ['nook', '📚 Reading nook'], ['tea', '☕ Tea on the sofa'], ['tv1', '📺 Watch TV'], ['warm', '🔥 Warm up by the fire'], ['coffee', '☕ Make coffee'], ['browse', '📚 Browse the bookshelf']]],
  ['Work', [['laptop', '💻 Laptop'], ['computer', '🖥️ Computer']]],
  ['Cats', [['playcats', '🪶 Play with the cats']]],
  ['Outdoors', [['stroll1', '🚶 Go for a walk'], ['jog', '🏃 Go for a run'], ['rake', '🍂 Rake leaves'], ['mums', '🌼 Water the mums'], ['bench1', '🍵 Sit in the garden'], ['patio1', '☕ Tea on the patio']]],
  ['Chores', [['cook', '🍲 Cook'], ['sweep', '🧹 Sweep the kitchen'], ['vacuum', '✨ Vacuum'], ['dust', '🪶 Dust'], ['makebed', '🛏️ Make the bed'], ['plants', '🪴 Water the plants'], ['wash', '🫧 Wash up']]],
];
const statusEl = document.getElementById('status'), menuEl = document.getElementById('menu');
const LABEL = Object.fromEntries(MENU.flatMap(([, items]) => items));
let chosenDur = 60;   // in-game minutes (= sim seconds)
statusEl.innerHTML = `<button id="fold"><span class="t">🏡 Household</span><span class="mini" id="mini"></span><span class="chev">▾</span></button><div id="statusBody">` + people.map((p, i) => `<div class="row"><b>${p.name}</b><span id="st${i}"></span></div>
  <div class="cmdrow"><button class="pick" id="pick${i}"><span class="lbl"></span><span class="car">▼</span></button><span class="left" id="left${i}"></span></div>
  <div class="bar"><div id="bar${i}"></div></div>`).join('')
  + `<div class="cats">${cats.map((c, i) => `<div class="row"><b>${c.name}</b><span id="cst${i}"></span></div>`).join('')}</div>
  <div id="durRow">Chosen activities last <span class="seg">${[[30, '30m'], [60, '1h'], [120, '2h']].map(([d, l]) => `<button data-d="${d}" class="${d === 60 ? 'on' : ''}">${l}</button>`).join('')}</span></div></div>`;
if (innerWidth < 760) statusEl.classList.add('collapsed');   // phones start with the panel folded
document.getElementById('fold').onclick = () => { statusEl.classList.toggle('collapsed'); closeMenu(); };
document.querySelectorAll('#durRow .seg button').forEach(b => b.onclick = () => { chosenDur = +b.dataset.d; document.querySelectorAll('#durRow .seg button').forEach(o => o.classList.toggle('on', o === b)); });
const selects = people.map((p, i) => {   // pill button per character; .value mirrors the chosen activity
  const el = document.getElementById(`pick${i}`);
  const pk = { el, _v: '', get value() { return this._v; }, set value(v) { this._v = v; el.querySelector('.lbl').textContent = LABEL[v] || '✨ Let them be'; el.classList.toggle('on', !!v); } };
  pk.value = ''; el.onclick = e => { e.stopPropagation(); openMenu(i); }; return pk;
});
let menuFor = -1;
function openMenu(i) {
  if (menuFor === i && menuEl.classList.contains('open')) return closeMenu();
  menuFor = i; const cur = selects[i].value;
  menuEl.innerHTML = `<h4>What should ${people[i].name} do?</h4>` + MENU.map(([g, items]) => [g, items.filter(([v]) => v.startsWith('T:') || likes(people[i], v))]).filter(([, items]) => items.length).map(([g, items]) => `<div class="sec">${g === 'Together' ? '💞 Together' : g}</div><div class="grid">${items.map(([v, l]) => {
    const [e, ...t] = l.split(' '); return `<button class="chip${v.startsWith('T:') ? ' together' : ''}${v === cur ? ' cur' : ''}" data-v="${v}"><span class="e">${e}</span>${t.join(' ')}</button>`; }).join('')}</div>`).join('')
    + `<button class="free" data-v="">✨ Let them go about their day</button>`;
  menuEl.querySelectorAll('[data-v]').forEach(b => b.onclick = e => { e.stopPropagation(); command(people[i], b.dataset.v, chosenDur); closeMenu(); });
  const r = selects[i].el.getBoundingClientRect(), w = Math.min(336, innerWidth - 32);
  menuEl.style.left = Math.max(16, Math.min(r.right - w, innerWidth - w - 16)) + 'px';
  menuEl.style.top = Math.min(r.bottom + 8, innerHeight - 200) + 'px';
  menuEl.classList.add('open');
}
function closeMenu() { menuEl.classList.remove('open'); menuFor = -1; }
addEventListener('pointerdown', e => { if (!menuEl.contains(e.target) && !e.target.closest('.pick')) closeMenu(); });
addEventListener('keydown', e => { if (e.key === 'Escape') closeMenu(); });
hooks.showPick = (p, value) => { selects[people.indexOf(p)].value = value; };
document.getElementById('zoomIn').onclick = () => zoomBy(1.25);
document.getElementById('zoomOut').onclick = () => zoomBy(1 / 1.25);
document.getElementById('home').onclick = () => { camTarget.set(0, .3, 0); camera.zoom = 1.3; camera.updateProjectionMatrix(); };
document.getElementById('rotL').onclick = () => rotateView(-1);
document.getElementById('rotR').onclick = () => rotateView(1);
document.getElementById('speed').innerHTML = `<span class="txt">Speed </span>${speed}×`;
document.getElementById('speed').onclick = e => { cycleSpeed(); document.getElementById('speed').innerHTML = `<span class="txt">Speed </span>${speed}×`; };

// season picker in the top-left panel
const seasonsEl = document.getElementById('seasons');
seasonsEl.innerHTML = Object.entries(SEASONS).map(([k, v]) => `<button data-s="${k}" title="${v.name}">${v.icon}<span class="txt"> ${v.name}</span></button>`).join('');
seasonsEl.querySelectorAll('button').forEach(b => b.onclick = () => setSeason(b.dataset.s));
onSeason(s => {
  seasonsEl.querySelectorAll('button').forEach(b => b.classList.toggle('on', b.dataset.s === s));
  document.querySelector('#hud .title').textContent = `${SEASONS[s].icon} The Cozy House`;
});

// weather picker: Auto (rainy spells come and go), Clear, Rain
const weatherEl = document.getElementById('weather');
weatherEl.innerHTML = Object.entries(WEATHER).map(([k, v]) => `<button data-w="${k}" title="${v.name}">${v.icon}<span class="txt"> ${v.name}</span></button>`).join('');
weatherEl.querySelectorAll('button').forEach(b => b.onclick = () => setWeather(b.dataset.w));
onWeather(() => weatherEl.querySelectorAll('button').forEach(b => b.classList.toggle('on', b.dataset.w === weather)));

// ---------------------------------------------------------------- household panel text (called every frame, touches the DOM only on change)
let lastStatus = '';
export function updateStatus() {
  const st = [
    ...people.map(p => `${p.mode === 'act' ? SPOTS[p.spot].icon + ' ' + SPOTS[p.spot].label + (p.lapCat && p.lapCat.act === 'lap' && p.lapCat.mode === 'act' ? ` · ${p.lapCat.name} on lap` : '') : '🚶 heading to the ' + ROOM_NAME[roomOf(SPOTS[p.target].x, SPOTS[p.target].z)]}`),
    ...cats.map(c => `${c.mode === 'playing' || c.mode === 'playWait' || c.pendingAct === 'playWait' && c.mode === 'walk' ? '🧶 playing with ' + cats.find(o => o !== c).name
      : c.mode === 'act' ? (CAT_ICON[c.act] || '🐾') + ' ' + (c.act === 'lap' ? `curled up on ${c.lapOf ? c.lapOf.name + "'s" : 'a'} lap` : CAT_LABEL[c.act]) : '🐾 trotting around'}`)];
  const left = people.map(p => p.cmd ? `${Math.max(1, Math.ceil(p.cmd.until - simT))} min left` : '');
  const key = st.join('|') + left.join('|');
  if (key === lastStatus) return;
  lastStatus = key;
  people.forEach((p, i) => {
    document.getElementById(`st${i}`).textContent = st[i]; document.getElementById(`left${i}`).textContent = left[i];
    document.getElementById(`bar${i}`).style.width = p.cmd ? `${100 * Math.max(0, p.cmd.until - simT) / p.cmd.dur}%` : '0%';
  });
  cats.forEach((c, i) => document.getElementById(`cst${i}`).textContent = st[people.length + i]);
  document.getElementById('mini').textContent = [...people, ...cats].map((a, i) => `${a.name} ${[...st[i]][0] || ''}`).join(' · ');
}
