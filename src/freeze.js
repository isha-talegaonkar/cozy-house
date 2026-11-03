import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { FREEZE } from './helpers.js';

// Merge every mesh that never moves into one mesh per material (per "keep" group), once at startup.
// The house has thousands of little meshes (books, leaves, cushions); drawing them one by one is too heavy for many phones.
const ATTRS = ['position', 'normal', 'uv'];
const matKey = m => FREEZE.mutable.has(m) ? m.uuid
  : [m.type, m.color?.getHex(), m.emissive?.getHex(), m.emissiveIntensity, m.roughness, m.metalness, m.flatShading, m.transparent, m.opacity, m.side, m.alphaTest, m.depthWrite, m.map?.uuid ?? ''].join('|');

export function freezeStatic(scene) {
  scene.updateMatrixWorld(true);
  let before = 0, after = 0;
  for (const root of [scene, ...FREEZE.keep]) {
    const inv = root.matrixWorld.clone().invert(), buckets = new Map();
    const visit = node => {
      for (const c of node.children) {
        if (FREEZE.keep.has(c) || FREEZE.exclude.has(c) || FREEZE.skip.has(c) || !c.visible) continue;
        if (c.isMesh && !c.isInstancedMesh && !Array.isArray(c.material)) {
          const g = c.geometry.index ? c.geometry.toNonIndexed() : c.geometry.clone();
          if (!ATTRS.every(a => g.attributes[a])) continue;
          Object.keys(g.attributes).forEach(a => { if (!ATTRS.includes(a)) g.deleteAttribute(a); });
          g.clearGroups(); g.applyMatrix4(new THREE.Matrix4().multiplyMatrices(inv, c.matrixWorld));
          const key = `${matKey(c.material)}|${c.castShadow}|${c.receiveShadow}|${c.renderOrder}`;
          if (!buckets.has(key)) buckets.set(key, { mesh: c, geos: [], meshes: [] });
          const b = buckets.get(key); b.geos.push(g); b.meshes.push(c);
        } else if (!c.isMesh && !c.isLight && !c.isSprite && !c.isCamera) visit(c);
      }
    };
    visit(root);
    for (const { mesh, geos, meshes } of buckets.values()) {
      before += meshes.length;
      const merged = meshes.length > 1 && mergeGeometries(geos, false);
      if (!merged) { after += meshes.length; continue; }
      const m = new THREE.Mesh(merged, mesh.material);
      Object.assign(m, { castShadow: mesh.castShadow, receiveShadow: mesh.receiveShadow, renderOrder: mesh.renderOrder });
      root.add(m); meshes.forEach(x => x.removeFromParent()); after++;
    }
  }
  return { before, after };
}
