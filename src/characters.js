import * as THREE from 'three';
import { scene } from './scene.js';
import { B, C, M, Sph, add, canvasTex, fabric, group, smooth, soft } from './helpers.js';
import { yarn } from './house.js';

// ---------------------------------------------------------------- characters
function knitTexture(base, rib, band) {   // vertical knit ribs, optional fair-isle band across the chest
  return canvasTex(128, 128, g => {
    g.fillStyle = base; g.fillRect(0, 0, 128, 128);
    g.fillStyle = rib; for (let x = 0; x < 128; x += 8) g.fillRect(x, 0, 3, 128);
    g.fillStyle = 'rgba(255,255,255,.08)'; for (let x = 4; x < 128; x += 8) for (let y = 0; y < 128; y += 6) g.fillRect(x, y, 3, 3);
    if (band) {
      g.fillStyle = band[0]; g.fillRect(0, 34, 128, 18); g.fillStyle = band[1];
      for (let x = 0; x < 128; x += 12) { g.beginPath(); g.moveTo(x, 43); g.lineTo(x + 6, 37); g.lineTo(x + 12, 43); g.lineTo(x + 6, 49); g.fill(); }
      g.fillRect(0, 32, 128, 2); g.fillRect(0, 52, 128, 2);
    }
  });
}
function pjTexture(base, accent, pattern) {   // pyjama print: polka dots or soft plaid
  return canvasTex(64, 64, g => {
    g.fillStyle = base; g.fillRect(0, 0, 64, 64); g.fillStyle = accent;
    if (pattern === 'dots') { for (let y = 4; y < 64; y += 12) for (let x = (y / 12 % 2) * 6 + 3; x < 64; x += 12) { g.beginPath(); g.arc(x, y, 2.2, 0, 7); g.fill(); } }
    else { g.globalAlpha = .45; for (let i = 0; i < 64; i += 16) { g.fillRect(i, 0, 6, 64); g.fillRect(0, i, 64, 6); } g.globalAlpha = 1; }
  });
}
function teeTexture(base) {   // soft cotton: flat colour with a faint weave
  return canvasTex(64, 64, g => { g.fillStyle = base; g.fillRect(0, 0, 64, 64); for (let i = 0; i < 400; i++) { g.fillStyle = `rgba(${Math.random() < .5 ? '255,255,255' : '0,0,0'},.05)`; g.fillRect(Math.random() * 64, Math.random() * 64, 2, 1); } });
}
export function makePerson(c) {
  const root = new THREE.Group(); root.rotation.order = 'YXZ'; scene.add(root);
  // chibi proportions: big round head, big sparkly eyes, small body
  const mS = smooth(c.skin), mP = fabric('#444'), mH = smooth(c.hair), mShoe = smooth('#444'), mDark = smooth('#22160f');   // clothes are coloured by setOutfit
  const white = new THREE.MeshBasicMaterial({ color: '#ffffff' });
  const thighs = [], knees = [], shins = [];
  for (const x of [-.085, .085]) {
    const th = group(x, .76, 0, 0, root); add(new THREE.CapsuleGeometry(.08, .24, 6, 14), mP, 0, -.19, 0, th);
    const kn = group(0, -.38, 0, 0, th); shins.push(add(new THREE.CapsuleGeometry(.07, .26, 6, 14), mP, 0, -.19, 0, kn));
    soft(.12, .08, .21, .035, mShoe, 0, -.37, .045, kn);
    thighs.push(th); knees.push(kn);
  }
  const body = group(0, .76, 0, 0, root);
  const knit = new THREE.MeshStandardMaterial({ roughness: 1 }), mRib = fabric('#444');
  add(new THREE.CapsuleGeometry(c.oversized ? .178 : .165, .24, 8, 20), knit, 0, .27, 0, body).scale.z = .9;     // cosy knit sweater
  add(new THREE.TorusGeometry(c.oversized ? .17 : .157, .03, 8, 22), mRib, 0, c.oversized ? .02 : .05, 0, body).rotation.x = Math.PI / 2;   // ribbed hem
  const turtle = add(new THREE.TorusGeometry(.07, .038, 10, 20), mRib, 0, .56, 0, body); turtle.rotation.x = Math.PI / 2;
  const crew = add(new THREE.TorusGeometry(.085, .018, 8, 20), mRib, 0, .53, .01, body); crew.rotation.x = Math.PI / 2 + .25;
  const arms = [-.225, .225].map(x => {
    const a = group(x, .48, 0, 0, body);
    // children[0] = sleeve, children[1] = hand (props and the feather wand rely on this order)
    add(new THREE.CapsuleGeometry(c.oversized ? .066 : .06, .27, 6, 12), knit, 0, -.18, 0, a); Sph(.054, mS, 0, -.41, 0, a, 14);
    add(new THREE.TorusGeometry(.056, .022, 8, 16), mRib, 0, -.34, 0, a).rotation.x = Math.PI / 2;               // ribbed cuff
    add(new THREE.CapsuleGeometry(.052, .27, 6, 12), mS, 0, -.18, 0, a);                                        // bare arm (summer)
    add(new THREE.CapsuleGeometry(c.oversized ? .07 : .066, .08, 6, 12), knit, 0, -.05, 0, a);                    // short sleeve (summer)
    return a;
  });
  C(.055, .06, .08, 12, mS, 0, .58, 0, body);
  const head = group(0, .84, 0, 0, body);
  const R = .265;
  Sph(R, mS, 0, 0, 0, head, 36);
  // put a feature flush on the face: z of the head surface at (x, y), plus a small offset
  const onFace = (x, y, off = 0) => Math.sqrt(Math.max(0, R * R - x * x - y * y)) + off;
  [-1, 1].forEach(sd => Sph(.045, mS, sd * .255, -.03, -.01, head, 12).scale.set(.5, .9, .9));                 // ears
  const ex = .1, ey = -.035, openEyes = [], closedEyes = [];
  [-1, 1].forEach(sd => {
    const x = sd * ex;
    const eye = Sph(.052, mDark, x, ey, onFace(x, ey, -.012), head, 18); eye.scale.set(.85, 1.15, .4);          // big glossy oval eyes
    const h1 = Sph(.017, white, x - sd * .014 - .006, ey + .024, onFace(x, ey + .024, .006), head, 10); h1.castShadow = false;
    const h2 = Sph(.008, white, x + .014, ey - .022, onFace(x, ey - .022, .006), head, 8); h2.castShadow = false;
    openEyes.push(eye, h1, h2);
    const shut = add(new THREE.TorusGeometry(.036, .007, 6, 16, Math.PI), mDark, x, ey + .008, onFace(x, ey, .004), head);   // closed eye: a soft curve
    shut.rotation.z = Math.PI; shut.castShadow = false; shut.visible = false; closedEyes.push(shut);
    const brow = add(new THREE.TorusGeometry(.03, .006, 6, 14, Math.PI * .7), mH, x, ey + .085, onFace(x, ey + .085, .002), head);
    brow.rotation.z = Math.PI * .15; brow.castShadow = false;                                                      // soft arched brow
    const ch = Sph(.045, M('#ff9a8a', { transparent: true, opacity: .5, flatShading: false }), sd * .165, -.1, onFace(sd * .165, -.1, -.01), head, 12);
    ch.scale.set(1.2, .7, .35); ch.castShadow = false;                                                             // rosy cheeks
  });
  const my = -.115;
  if (c.bigSmile) {   // little open smile
    const m = add(new THREE.CircleGeometry(.032, 18, Math.PI, Math.PI), smooth('#8e3434'), 0, my + .012, onFace(0, my, .003), head); m.castShadow = false;
    const tongue = add(new THREE.CircleGeometry(.015, 12, Math.PI, Math.PI), smooth('#e07a7a'), 0, my - .006, onFace(0, my, .004), head); tongue.castShadow = false;
  } else {
    const sm = add(new THREE.TorusGeometry(.022, .006, 6, 14, Math.PI), smooth('#7a3a30'), 0, my + .01, onFace(0, my, .004), head); sm.rotation.z = Math.PI; sm.castShadow = false;
  }
  add(new THREE.SphereGeometry(R + .013, 32, 12, 0, Math.PI * 2, 0, Math.PI * .36), mH, 0, .01, -.01, head);    // crown (stops above the brows)
  add(new THREE.SphereGeometry(R + .013, 32, 18, Math.PI / 2 + 1.0, Math.PI * 2 - 2.0, 0, Math.PI * .6), mH, 0, .01, -.01, head);   // back + sides, open at the face
  Sph(.25, mH, 0, -.03, -.08, head, 24).scale.set(1.08, 1.03, 1);
  if (c.style === 'long') {   // soft, rounded hair falling to the shoulders, curtain bangs, a little bow
    Sph(.27, mH, 0, -.1, -.08, head, 28).scale.set(1.06, 1.08, .86);                                              // mane behind the head
    Sph(.22, mH, 0, -.3, -.1, head, 24).scale.set(1.18, .85, .7);                                                 // ends resting on the shoulders
    [-1, 1].forEach(sd => {
      Sph(.085, mH, sd * .215, -.16, .06, head, 16).scale.set(.85, 2.1, .8);                                     // face-framing locks
      Sph(.07, mH, sd * .205, -.31, .05, head, 14).scale.set(1, 1.1, .85);
      const bang = Sph(.125, mH, sd * .095, .135, onFace(sd * .095, .135, -.075), head, 18); bang.scale.set(1.2, .4, .55); bang.rotation.set(-.35, 0, sd * .55);
    });
    const bow = smooth('#f3e6cf');                                                                                  // little bow
    [-1, 1].forEach(sd => Sph(.032, bow, -.17 + sd * .028, .17, .08, head, 10).scale.set(1.1, .7, .6));
    Sph(.014, bow, -.17, .17, .095, head, 8);
  } else {   // swept-up hair, light beard + moustache, thin rectangular glasses
    const top = Sph(.155, mH, 0, .2, .05, head, 20); top.scale.set(1.5, .72, 1.2); top.rotation.x = -.2;
    const swoop = Sph(.1, mH, .05, .21, .17, head, 16); swoop.scale.set(1.5, .55, .9); swoop.rotation.z = -.25;
    const mBeard = smooth('#3a2a20');
    add(new THREE.SphereGeometry(R + .006, 32, 10, Math.PI / 2 - 1.05, 2.1, Math.PI * .66, Math.PI * .26), mBeard, 0, 0, 0, head);   // jaw + chin
    const mo = soft(.075, .018, .016, .008, mBeard, 0, my + .032, onFace(0, my + .032, .002), head); mo.castShadow = false;           // moustache
    const fr = smooth('#1c2230'), gz = d => onFace(ex, ey, .018 + d);
    [-1, 1].forEach(sd => {
      const gx = sd * ex;
      [[0, .046, .12, .008], [0, -.044, .12, .007]].forEach(([dx, dy, w, h]) => B(w, h, .008, fr, gx + dx, ey + dy, gz(0), head));
      [-.06, .06].forEach(dx => B(.008, .09, .008, fr, gx + dx, ey, gz(0), head));
      B(.008, .01, .2, fr, sd * .165, ey + .03, .15, head);                                                       // temple arm
    });
    B(.04, .008, .008, fr, 0, ey + .02, gz(.004), head);
  }
  const book = B(.26, .2, .03, M('#3f6a6a'), 0, .32, .3, body); book.rotation.x = -.7;
  const mug = C(.045, .04, .09, 8, '#efe2c4', 0, -.44, .05, arms[1]);
  const can = group(0, -.45, .06, 0, arms[1]);
  B(.1, .11, .15, M('#7d9a8a'), 0, -.02, .02, can); C(.012, .018, .16, 6, '#7d9a8a', 0, .02, .15, can).rotation.x = 1.0;
  const rake = group(0, -.4, 0, 0, arms[1]);
  C(.014, .014, 1.2, 5, '#a8784a', 0, -.55, 0, rake); B(.32, .03, .06, M('#5a5f64'), 0, -1.15, .03, rake);
  const broom = group(0, -.4, 0, 0, arms[1]);
  C(.014, .014, 1.2, 5, '#c9a36b', 0, -.55, 0, broom); B(.26, .14, .08, M('#d9b45a'), 0, -1.17, .03, broom);
  const vac = group(0, -.4, 0, 0, arms[1]);
  C(.016, .016, 1.1, 5, '#5a5f64', 0, -.5, 0, vac); B(.3, .06, .12, M('#b5543f'), 0, -1.07, .05, vac);
  const duster = group(0, -.42, 0, 0, arms[1]);
  C(.012, .012, .3, 5, '#8a5634', 0, -.12, .05, duster).rotation.x = .4; Sph(.07, M('#e9c9e0'), 0, -.27, .12, duster, 8);
  const pad = group(.23, -.42, .06, 0, arms[0]); B(.2, .04, .1, M('#2a2a32'), 0, 0, 0, pad); Sph(.012, M('#e85d5d'), .05, .025, 0, pad, 6); Sph(.012, M('#5d9ae8'), -.05, .025, 0, pad, 6);
  const bowl = group(.2, -.44, .1, 0, arms[0]); C(.09, .06, .08, 14, smooth('#efe2c8'), 0, 0, 0, bowl); C(.075, .075, .01, 14, smooth('#e8d2a0'), 0, .035, 0, bowl);
  const yarn = group(.2, -.44, .08, 0, arms[0]); Sph(.05, fabric('#c96a68'), 0, 0, 0, yarn, 10); C(.006, .006, .14, 5, '#d9c9a0', -.1, .03, 0, yarn).rotation.z = 1.2;
  // winter woollies, worn outdoors: beanie with a pom-pom and a scarf
  const woolly = fabric('#b5343a');
  const beanie = group(0, 0, 0, 0, head);
  add(new THREE.SphereGeometry(R + .035, 28, 12, 0, Math.PI * 2, 0, Math.PI * .42), woolly, 0, .02, -.01, beanie);
  add(new THREE.TorusGeometry(R * .93, .03, 8, 28), fabric('#efe2c8'), 0, .095, -.01, beanie).rotation.x = Math.PI / 2;
  Sph(.06, fabric('#efe2c8'), 0, R + .07, -.01, beanie, 12);
  const scarf = group(0, 0, 0, 0, body);
  add(new THREE.TorusGeometry(.1, .045, 10, 22), woolly, 0, .56, .01, scarf).rotation.x = Math.PI / 2;
  soft(.08, .26, .04, .02, woolly, .07, .4, .15, scarf).rotation.z = .15;
  beanie.visible = scarf.visible = false;
  // dress for the season: { top: 'knit' | 'tee' | 'pj', pattern?, color, rib, band?, collar: 'turtle' | 'crew', short?, shorts?, pants, shoes }
  function setOutfit(o) {
    knit.map?.dispose(); knit.map = o.top === 'tee' ? teeTexture(o.color) : o.top === 'pj' ? pjTexture(o.color, o.rib, o.pattern) : knitTexture(o.color, o.rib, o.band); knit.needsUpdate = true;
    mP.map = o.top === 'pj' ? knit.map : null; mP.needsUpdate = true;   // pyjama bottoms match the top
    mRib.color.set(o.rib); mP.color.set(o.top === 'pj' ? '#ffffff' : o.pants); mShoe.color.set(o.shoes);
    turtle.visible = o.collar === 'turtle'; crew.visible = o.collar !== 'turtle';
    arms.forEach(a => { a.children[0].visible = a.children[2].visible = !o.short; a.children[3].visible = a.children[4].visible = !!o.short; });
    shins.forEach(m => m.material = o.shorts ? mS : mP);
  }
  setOutfit(c.outfit);
  const setEyes = open => { openEyes.forEach(m => m.visible = open); closedEyes.forEach(m => m.visible = !open); };
  return { setEyes, root, body, arms, head, thighs, knees, book, mug, can, rake, broom, vac, duster, pad, bowl, yarn, beanie, scarf, setOutfit };
}
export function makeCat(col, accent) {
  const root = new THREE.Group(); scene.add(root);
  const m = M(col, { flatShading: false }), mA = M(accent, { flatShading: false });
  const body = group(0, .2, 0, 0, root);
  const torso = Sph(.15, m, 0, 0, 0, body, 14); torso.scale.set(.85, .8, 1.55);
  Sph(.08, mA, 0, -.04, .17, body, 10).scale.set(1, 1, .6);
  const head = group(0, .1, .24, 0, body);
  Sph(.11, m, 0, 0, 0, head, 14).scale.set(1.05, .95, .95);
  [-1, 1].forEach(s => { const e = add(new THREE.ConeGeometry(.045, .09, 4), m, s * .06, .1, 0, head); e.rotation.z = -s * .3; });
  [-.04, .04].forEach(x => Sph(.016, M('#2a2a1a'), x, .02, .095, head, 6));
  Sph(.012, M('#e8977a'), 0, -.02, .105, head, 6);
  Sph(.05, mA, 0, -.04, .07, head, 8).scale.set(1, .7, .6);
  const tail = group(0, .03, -.22, 0, body);
  add(new THREE.CapsuleGeometry(.025, .3, 4, 6), m, 0, .17, 0, tail);
  const legs = [[-.07, .13], [.07, .13], [-.07, -.13], [.07, -.13]].map(([x, z]) => { const l = group(x, -.02, z, 0, body); C(.03, .03, .18, 6, m, 0, -.09, 0, l); return l; });
  return { root, body, head, tail, legs, torso };
}
