/* Jomouh 3D scenes — requires three.js r128 (assets/js/three.min.js) */
(function () {
class JomouhScene {
  constructor(box) {
    this.box = box;
    this.props = { kind: box.dataset.kind || 'stone', tone: box.dataset.tone || 'auto' };
    this.canvas = document.createElement('canvas');
    this.canvas.setAttribute('aria-hidden', 'true');
    box.insertBefore(this.canvas, box.firstChild);
    this.mouse = { x: 0, y: 0, tx: 0, ty: 0 };
    this.visible = true;
  }
  dark() { const t = this.props.tone ?? 'auto'; const k = this.props.kind ?? 'stone'; return t === 'dark' || (t === 'auto' && (k === 'media' || k === 'stone')); }

  // ---------- helpers ----------
  noiseFns(seed) {
    const hash = (x, y) => { const s = Math.sin(x * 127.1 + y * 311.7 + seed * 74.7) * 43758.5453; return s - Math.floor(s); };
    const noise = (x, y) => {
      const ix = Math.floor(x), iy = Math.floor(y), fx = x - ix, fy = y - iy;
      const ux = fx * fx * (3 - 2 * fx), uy = fy * fy * (3 - 2 * fy);
      const a = hash(ix, iy), b = hash(ix + 1, iy), c = hash(ix, iy + 1), d = hash(ix + 1, iy + 1);
      return a + (b - a) * ux + (c - a) * uy + (a - b - c + d) * ux * uy;
    };
    const fbm = (x, y) => { let v = 0, a = 0.5; for (let i = 0; i < 5; i++) { v += a * noise(x, y); x = x * 2.03 + 17.1; y = y * 2.03 + 9.3; a *= 0.5; } return v; };
    return fbm;
  }
  marbleTexture(base, vein, vein2, seed, dir, opts) {
    const T = window.THREE;
    opts = opts || {};
    const W = opts.w || 768, H = opts.h || 480;
    const c = document.createElement('canvas'); c.width = W; c.height = H;
    const ctx = c.getContext('2d');
    const img = ctx.createImageData(W, H);
    const fbm = this.noiseFns(seed);
    const fbm2 = this.noiseFns(seed + 11.3);
    const sc = opts.scale || 210;
    const rough = !!opts.rough;
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const px = x / sc + dir[0] * 0.0, py = y / sc;
        const qx = fbm(px * 0.8, py * 0.8), qy = fbm(px * 0.8 + 5.2, py * 0.8 + 1.3);
        const n = fbm(px + 2.8 * qx + dir[0], py + 2.8 * qy + dir[1]);
        const c1 = Math.abs(n * 1.9 - Math.round(n * 1.9));
        const w1 = 0.006 + 0.03 * fbm2(px * 1.5, py * 1.5);
        const mk = fbm2(px * 0.7 + 3.0, py * 0.7); const mask = Math.min(1, Math.max(0, (mk - 0.38) / 0.24));
        const main = Math.exp(-(c1 * c1) / (w1 * w1)) * (0.25 + 0.75 * mask);
        const halo = Math.exp(-(c1 * c1) / (w1 * w1 * 16)) * 0.22;
        const m = fbm2(px * 2.4 + qx * 2.0, py * 2.4 + qy * 2.0);
        const c2 = Math.abs(m * 4.0 - Math.round(m * 4.0));
        const fine = Math.exp(-(c2 * c2) / 0.00008) * 0.28 * (0.3 + 0.7 * mask);
        const tint = fbm2(px * 0.6 + 9.1, py * 0.6 + 3.3);
        const cloud = (fbm(px * 0.5 + 40, py * 0.5) - 0.5) * 0.16;
        const grain = (Math.random() - 0.5) * (rough ? 22 : 5);
        let r = base[0] * (1 + cloud) + grain, g = base[1] * (1 + cloud) + grain, b = base[2] * (1 + cloud) + grain;
        const vc0 = vein[0] + (vein2[0] - vein[0]) * Math.max(0, tint - 0.45) * 2.2;
        const vc1 = vein[1] + (vein2[1] - vein[1]) * Math.max(0, tint - 0.45) * 2.2;
        const vc2 = vein[2] + (vein2[2] - vein[2]) * Math.max(0, tint - 0.45) * 2.2;
        const k = Math.min(1, main * 0.9 + halo + fine) * (rough ? 0.45 : 1);
        r += (vc0 - r) * k; g += (vc1 - g) * k; b += (vc2 - b) * k;
        const i = (y * W + x) * 4;
        img.data[i] = r; img.data[i + 1] = g; img.data[i + 2] = b; img.data[i + 3] = 255;
      }
    }
    ctx.putImageData(img, 0, 0);
    const tex = new T.CanvasTexture(c);
    tex.encoding = T.sRGBEncoding;
    tex.anisotropy = 8;
    tex.wrapS = T.RepeatWrapping;
    return tex;
  }
  studioEnv(renderer, bright) {
    const T = window.THREE;
    const pmrem = new T.PMREMGenerator(renderer);
    const env = new T.Scene();
    const room = new T.Mesh(new T.BoxGeometry(20, 20, 20), new T.MeshBasicMaterial({ color: bright ? 0x3c3a38 : 0x1e1e1e, side: T.BackSide }));
    env.add(room);
    const panel = (w, h, x, y, z, ry, rx, k) => {
      const m = new T.MeshBasicMaterial({ color: 0xffffff, side: T.DoubleSide });
      m.color.setScalar(k);
      const p = new T.Mesh(new T.PlaneGeometry(w, h), m);
      p.position.set(x, y, z); p.rotation.y = ry; p.rotation.x = rx;
      env.add(p);
    };
    panel(10, 3, 0, 9.5, 0, 0, Math.PI / 2, 7);
    panel(3, 8, -9.5, 2, 2, Math.PI / 2, 0, 5);
    panel(3, 8, 9.5, 2, -3, -Math.PI / 2, 0, 2.5);
    panel(8, 2, 0, 3, -9.5, 0, 0, 2);
    const tex = pmrem.fromScene(env, 0.04).texture;
    pmrem.dispose();
    return tex;
  }
  shadowFloor(scene, opacity) {
    const T = window.THREE;
    const floor = new T.Mesh(new T.PlaneGeometry(40, 40), new T.ShadowMaterial({ opacity }));
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);
  }
  keyLight(scene, x, y, z, i) {
    const T = window.THREE;
    const d = new T.DirectionalLight(0xffffff, i);
    d.position.set(x, y, z);
    d.castShadow = true;
    d.shadow.mapSize.set(this.small ? 1024 : 2048, this.small ? 1024 : 2048);
    d.shadow.camera.left = -8; d.shadow.camera.right = 8; d.shadow.camera.top = 8; d.shadow.camera.bottom = -8;
    d.shadow.radius = 6;
    d.shadow.bias = -0.0005;
    scene.add(d);
    return d;
  }

  // ---------- scenes ----------
  buildStone(scene, camera) {
    const T = window.THREE;
    camera.position.set(1.4, 2.5, 8.6);
    camera.lookAt(-0.3, 0.95, 0.2);
    this.shadowFloor(scene, this.dark() ? 0.6 : 0.3);
    this.keyLight(scene, -4, 8, 6, 1.6);
    const rim = new T.DirectionalLight(0xfff2dc, 0.8); rim.position.set(6, 3, -4); scene.add(rim);
    scene.add(new T.AmbientLight(0xffffff, 0.3));
    const W = 3.0, Hs = 1.9, D = 0.05;
    const tex = this.marbleTexture([243, 241, 236], [96, 94, 90], [176, 140, 88], 3.3, [0.0, 0.0], { w: 1024, h: 640, scale: 260 });
    const mir = tex.clone(); mir.needsUpdate = true; mir.repeat.x = -1; mir.offset.x = 1;
    const polished = new T.MeshPhysicalMaterial({ map: tex, roughness: 0.12, clearcoat: 1, clearcoatRoughness: 0.04 });
    const polishedM = new T.MeshPhysicalMaterial({ map: mir, roughness: 0.12, clearcoat: 1, clearcoatRoughness: 0.04 });
    const edge = new T.MeshStandardMaterial({ color: 0xe9e6e0, roughness: 0.55 });
    const rawTex = this.marbleTexture([214, 210, 202], [150, 146, 140], [170, 150, 120], 3.3, [0.4, 0.2], { w: 512, h: 512, scale: 180, rough: true });
    const raw = new T.MeshStandardMaterial({ map: rawTex, roughness: 0.92 });
    const all = new T.Group();
    const block = new T.Mesh(new T.BoxGeometry(2.6, 1.95, 1.7), raw);
    block.position.set(-2.55, 0.975, -1.3);
    block.rotation.y = 0.45;
    block.castShadow = true; block.receiveShadow = true;
    all.add(block);
    const hinge = new T.Group();
    hinge.position.set(-1.35, 0, 0.1);
    all.add(hinge);
    this.slabs = [];
    const N = 6;
    for (let i = 0; i < N; i++) {
      const pivot = new T.Group();
      const mat = i % 2 ? polishedM : polished;
      const slab = new T.Mesh(new T.BoxGeometry(W, Hs, D), [edge, edge, edge, edge, mat, mat]);
      slab.position.set(W / 2, Hs / 2 + 0.01, 0);
      slab.castShadow = true; slab.receiveShadow = true;
      pivot.add(slab);
      pivot.position.z = -i * 0.004;
      hinge.add(pivot);
      this.slabs.push(pivot);
    }
    scene.add(all);
    this.animateScene = (t) => {
      const open = 0.8 + 0.2 * Math.sin(t * 0.35 - 1.2);
      this.slabs.forEach((p, i) => {
        const f = i / (this.slabs.length - 1);
        p.rotation.y = -(0.08 + f * 1.25) * open;
      });
      all.rotation.y = Math.sin(t * 0.1) * 0.06 + this.mouse.x * 0.25;
      camera.position.y = 2.5 + this.mouse.y * 0.5;
      camera.lookAt(-0.3, 0.95, 0.2);
    };
  }
  buildKitchen(scene, camera) {
    const T = window.THREE;
    camera.position.set(3.4, 3.0, camera.aspect < 1.4 ? 10.4 : 8.6);
    camera.lookAt(0.3, 1.1, 0);
    this.shadowFloor(scene, this.dark() ? 0.6 : 0.3);
    this.keyLight(scene, 2, 9, 6, 1.1);
    const rim = new T.DirectionalLight(0xdfe8ff, 0.6); rim.position.set(-6, 4, -3); scene.add(rim);
    scene.add(new T.AmbientLight(0xffffff, 0.25));
    const steel = new T.MeshStandardMaterial({ color: 0xd6d8da, metalness: 1, roughness: 0.32 });
    const polish = new T.MeshStandardMaterial({ color: 0xf2f2f2, metalness: 1, roughness: 0.12 });
    const iron = new T.MeshStandardMaterial({ color: 0x1b1b1b, metalness: 0.6, roughness: 0.55 });
    const black = new T.MeshPhysicalMaterial({ color: 0x080808, roughness: 0.1, clearcoat: 1, clearcoatRoughness: 0.03 });
    const box = (w, h, d, mat, x, y, z, parent) => { const m = new T.Mesh(new T.BoxGeometry(w, h, d), mat); m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true; (parent || line).add(m); return m; };
    const cyl = (r1, r2, h, mat, x, y, z, rx, rz, parent) => { const m = new T.Mesh(new T.CylinderGeometry(r1, r2, h, 32), mat); m.position.set(x, y, z); m.rotation.x = rx || 0; m.rotation.z = rz || 0; m.castShadow = true; (parent || line).add(m); return m; };
    const line = new T.Group();
    // ---- 6-burner commercial range with double oven ----
    const RW = 2.4, RD = 1.0, legH = 0.14, bodyH = 0.86, top = legH + bodyH;
    box(RW, bodyH, RD, steel, 0, legH + bodyH / 2, 0);
    [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach((p) => cyl(0.035, 0.035, legH, polish, p[0] * (RW / 2 - 0.08), legH / 2, p[1] * (RD / 2 - 0.08)));
    box(RW, 0.34, 0.06, steel, 0, top + 0.17, -RD / 2 + 0.03);
    box(RW, 0.1, 0.12, polish, 0, top - 0.08, RD / 2 + 0.02);
    this.flames = [];
    for (let i = 0; i < 6; i++) {
      const bx = -RW / 2 + 0.4 + (i % 3) * 0.8, bz = i < 3 ? -0.22 : 0.24;
      box(0.66, 0.03, 0.05, iron, bx, top + 0.05, bz);
      box(0.05, 0.03, 0.42, iron, bx, top + 0.05, bz);
      cyl(0.09, 0.1, 0.03, iron, bx, top + 0.02, bz);
      const fl = new T.Mesh(new T.TorusGeometry(0.1, 0.012, 8, 40), new T.MeshBasicMaterial({ color: 0x4f8dff, toneMapped: false }));
      fl.rotation.x = Math.PI / 2; fl.position.set(bx, top + 0.04, bz);
      line.add(fl); this.flames.push(fl);
      cyl(0.035, 0.035, 0.05, black, -RW / 2 + 0.25 + i * 0.38, top - 0.08, RD / 2 + 0.1, Math.PI / 2);
    }
    [-0.6, 0.6].forEach((x) => {
      box(1.12, 0.62, 0.04, polish, x, legH + 0.38, RD / 2 + 0.02);
      const glass = box(0.8, 0.3, 0.01, new T.MeshBasicMaterial({ color: 0xff8a3d, toneMapped: false }), x, legH + 0.4, RD / 2 + 0.045);
      glass.material.color.setScalar(1); glass.material.color.setRGB(1.0, 0.45, 0.12);
      box(0.86, 0.34, 0.012, new T.MeshPhysicalMaterial({ color: 0x111111, transparent: true, opacity: 0.55, roughness: 0.05, clearcoat: 1 }), x, legH + 0.4, RD / 2 + 0.05);
      cyl(0.022, 0.022, 0.9, polish, x, legH + 0.66, RD / 2 + 0.12, 0, Math.PI / 2);
    });
    // big stockpot + rondeau on the burners
    const V = (a) => a.map((p) => new T.Vector2(p[0], p[1]));
    const lathe = (pts, mat, x, y, z) => { const m = new T.Mesh(new T.LatheGeometry(V(pts), 96), mat); m.position.set(x, y, z); m.castShadow = true; line.add(m); return m; };
    lathe([[0, 0], [0.34, 0], [0.36, 0.03], [0.36, 0.7], [0.39, 0.72], [0.34, 0.72], [0.34, 0.03], [0, 0.03]], steel, -0.4, top + 0.06, -0.22);
    lathe([[0, 0], [0.4, 0], [0.42, 0.03], [0.42, 0.2], [0.45, 0.22], [0.4, 0.22], [0.4, 0.03], [0, 0.03]], polish, 0.4, top + 0.06, 0.24);
    // ---- extraction hood ----
    const hood = new T.Group();
    box(RW + 0.9, 0.5, 1.25, steel, 0, 0, 0, hood);
    box(RW + 0.9, 0.08, 1.3, polish, 0, -0.27, 0.02, hood);
    for (let i = 0; i < 5; i++) box(0.56, 0.02, 0.5, iron, -1.3 + i * 0.65, -0.31, 0.15, hood);
    box(0.7, 0.9, 0.6, steel, 0, 0.7, -0.25, hood);
    hood.position.set(0.25, 2.85, -0.1);
    line.add(hood);
    // ---- stainless prep table with stacked gastronorm pans ----
    const px = 2.15;
    box(1.5, 0.05, 0.9, polish, px, 0.92, 0);
    box(1.44, 0.03, 0.84, steel, px, 0.3, 0);
    [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach((p) => cyl(0.025, 0.025, 0.9, steel, px + p[0] * 0.68, 0.45, p[1] * 0.38));
    for (let i = 0; i < 4; i++) box(0.62, 0.1, 0.5, i % 2 ? steel : polish, px - 0.3, 0.99 + i * 0.1, -0.1 + (i % 2) * 0.02);
    for (let i = 0; i < 3; i++) box(0.5, 0.14, 0.4, steel, px + 0.35, 0.36 + i * 0.0, -0.15 + i * 0.0).position.y = 0.39 + i * 0.14;
    lathe([[0, 0], [0.2, 0], [0.22, 0.02], [0.24, 0.3], [0.26, 0.31], [0.22, 0.31], [0.2, 0.03], [0, 0.03]], polish, px + 0.4, 0.95, 0.15);
    // ---- 2-door reach-in refrigerator ----
    const fx = -1.95;
    box(1.2, 2.05, 0.85, steel, fx, 1.075, -0.02);
    box(0.57, 1.86, 0.03, polish, fx - 0.3, 1.05, 0.42);
    box(0.57, 1.86, 0.03, polish, fx + 0.3, 1.05, 0.42);
    cyl(0.02, 0.02, 0.7, polish, fx - 0.06, 1.2, 0.48);
    cyl(0.02, 0.02, 0.7, polish, fx + 0.06, 1.2, 0.48);
    box(1.2, 0.12, 0.8, black, fx, 2.0, 0.02).material = black;
    scene.add(line);
    this.animateScene = (t) => {
      line.rotation.y = Math.sin(t * 0.18) * 0.28 + this.mouse.x * 0.3;
      this.flames.forEach((f, i) => { const s = 1 + Math.sin(t * 9 + i * 1.7) * 0.06; f.scale.set(s, s, 1); });
      camera.position.y = 3.0 + this.mouse.y * 0.6;
      camera.lookAt(0.3, 1.1, 0);
    };
  }
  screenTexture(draw) {
    const T = window.THREE;
    const c = document.createElement('canvas'); c.width = 512; c.height = 896;
    const x = c.getContext('2d');
    draw(x, 512, 896);
    const tex = new T.CanvasTexture(c); tex.encoding = T.sRGBEncoding; tex.anisotropy = 8;
    return tex;
  }
  buildMedia(scene, camera) {
    const T = window.THREE;
    camera.position.set(0, 0.2, camera.aspect < 1.4 ? 13.2 : 10.2);
    camera.lookAt(0, 0, 0);
    scene.add(new T.AmbientLight(0xffffff, 0.4));
    const d = new T.DirectionalLight(0xffffff, 1.0); d.position.set(3, 5, 6); scene.add(d);
    const F = "600 {s}px 'Inter Tight', 'Helvetica Neue', Arial, sans-serif";
    const f = (s) => F.replace('{s}', s);
    const draws = [
      (x, w, h) => { x.fillStyle = '#F2EFE9'; x.fillRect(0, 0, w, h); x.fillStyle = '#111'; x.font = f(96); x.fillText('Ideas', 40, 300); x.fillText('that', 40, 400); x.fillText('move', 40, 500); x.fillText('markets.', 40, 600); x.fillRect(40, 700, 120, 6); x.font = f(26); x.fillText('JOMOUH MEDIA', 40, 800); },
      (x, w, h) => { x.fillStyle = '#FFFFFF'; x.fillRect(0, 0, w, h); x.fillStyle = '#111'; x.beginPath(); x.arc(70, 80, 30, 0, Math.PI * 2); x.fill(); x.fillRect(120, 62, 180, 16); x.fillStyle = '#BBB'; x.fillRect(120, 88, 110, 12); x.fillStyle = '#1C1C1C'; x.fillRect(0, 140, w, 460); x.fillStyle = '#E8E3DA'; x.beginPath(); x.arc(256, 370, 120, 0, Math.PI * 2); x.fill(); x.fillStyle = '#111'; x.font = f(34); x.fillText('New collection', 40, 680); x.fillStyle = '#999'; x.fillRect(40, 710, 380, 14); x.fillRect(40, 738, 300, 14); x.fillStyle = '#111'; x.fillRect(40, 790, 200, 56); x.fillStyle = '#FFF'; x.font = f(24); x.fillText('Shop now', 76, 827); },
      (x, w, h) => { x.fillStyle = '#111'; x.fillRect(0, 0, w, h); x.fillStyle = '#FFF'; x.font = f(30); x.fillText('Campaign reach', 40, 90); x.fillStyle = '#777'; x.font = f(22); x.fillText('Last 12 weeks', 40, 130); const v = [0.2, 0.28, 0.25, 0.36, 0.42, 0.4, 0.52, 0.58, 0.63, 0.72, 0.8, 0.92]; v.forEach((a, i) => { x.fillStyle = i === 11 ? '#FFFFFF' : '#555'; x.fillRect(40 + i * 37, 760 - a * 520, 26, a * 520); }); x.strokeStyle = '#FFF'; x.lineWidth = 4; x.beginPath(); v.forEach((a, i) => { const px = 53 + i * 37, py = 740 - a * 560; if (i) x.lineTo(px, py); else x.moveTo(px, py); }); x.stroke(); },
      (x, w, h) => { x.fillStyle = '#E9E5DD'; x.fillRect(0, 0, w, h); x.fillStyle = '#111'; x.font = f(200); x.fillText('Aa', 40, 300); const sw = ['#111111', '#5E5C58', '#B5B2AC', '#FFFFFF']; sw.forEach((c, i) => { x.fillStyle = c; x.fillRect(40 + i * 110, 380, 96, 96); }); x.fillStyle = '#111'; x.font = f(30); x.fillText('Brand system', 40, 560); x.fillStyle = '#6E6C67'; x.fillRect(40, 600, 400, 12); x.fillRect(40, 626, 340, 12); x.fillRect(40, 652, 380, 12); x.strokeStyle = '#111'; x.lineWidth = 3; x.strokeRect(40, 720, 432, 120); x.font = f(40); x.fillText('JOMOUH', 150, 795); },
      (x, w, h) => { x.fillStyle = '#FFFFFF'; x.fillRect(0, 0, w, h); x.fillStyle = '#111'; x.font = f(30); x.fillText('Search results', 40, 90); for (let i = 0; i < 5; i++) { const y = 160 + i * 140; x.fillStyle = i === 0 ? '#111' : '#DDD'; x.fillRect(40, y, 300, 22); x.fillStyle = '#AAA'; x.fillRect(40, y + 40, 420, 12); x.fillRect(40, y + 64, 360, 12); } x.fillStyle = '#111'; x.font = f(22); x.fillText('#1', 400, 180); },
    ];
    const body = new T.MeshPhysicalMaterial({ color: 0x0c0c0c, roughness: 0.2, metalness: 0.2, clearcoat: 1, clearcoatRoughness: 0.05 });
    const group = new T.Group();
    const layout = [[-2.7, 0.2, -1.2, 0.5, 0.05], [-1.2, -0.25, 0.2, 0.28, -0.04], [0.35, 0.3, 0.9, 0.05, 0.03], [1.9, -0.15, 0.1, -0.25, -0.05], [3.3, 0.25, -1.1, -0.48, 0.04]];
    this.cards = [];
    draws.forEach((dr, i) => {
      const g = new T.Group();
      const shell = new T.Mesh(new T.BoxGeometry(1.62, 2.86, 0.09), body);
      const screen = new T.Mesh(new T.PlaneGeometry(1.5, 2.64), new T.MeshBasicMaterial({ map: this.screenTexture(dr), toneMapped: false }));
      screen.position.z = 0.047;
      g.add(shell); g.add(screen);
      const L = layout[i];
      g.position.set(L[0], L[1], L[2]); g.rotation.y = L[3]; g.rotation.z = L[4];
      g.userData = { base: L.slice(), ph: i * 1.3 };
      group.add(g); this.cards.push(g);
    });
    const ring = new T.Mesh(new T.TorusGeometry(4.6, 0.006, 8, 200), new T.MeshBasicMaterial({ color: 0x444444 }));
    ring.rotation.x = Math.PI / 2 - 0.25; ring.position.y = -1.9;
    group.add(ring);
    scene.add(group);
    this.animateScene = (t) => {
      this.cards.forEach((g) => {
        const b = g.userData.base, p = g.userData.ph;
        g.position.y = b[1] + Math.sin(t * 0.8 + p) * 0.12;
        g.rotation.y = b[3] + Math.sin(t * 0.4 + p) * 0.06;
      });
      group.rotation.y = this.mouse.x * 0.3;
      group.rotation.x = -this.mouse.y * 0.12;
    };
  }

  init() {
    const T = window.THREE;
    const canvas = this.canvas, box = this.box;
    if (!canvas || !box || !T) return;
    const w = box.offsetWidth || 740, h = box.offsetHeight || 560;
    this.small = w < 500;
    const renderer = new T.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, this.small ? 1.5 : 2));
    renderer.setSize(w, h, false);
    renderer.outputEncoding = T.sRGBEncoding;
    renderer.toneMapping = T.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = T.PCFSoftShadowMap;
    this.renderer = renderer;
    const scene = new T.Scene();
    scene.environment = this.studioEnv(renderer, !this.dark());
    const camera = new T.PerspectiveCamera(32, w / h, 0.1, 100);
    this.camera = camera;
    const kind = this.props.kind ?? 'stone';
    if (kind === 'media') this.buildMedia(scene, camera);
    else if (kind === 'kitchen') this.buildKitchen(scene, camera);
    else this.buildStone(scene, camera);
    this.onMove = (e) => {
      const r = box.getBoundingClientRect();
      this.mouse.tx = ((e.clientX - r.left) / r.width) * 2 - 1;
      this.mouse.ty = -(((e.clientY - r.top) / r.height) * 2 - 1);
    };
    this.onLeave = () => { this.mouse.tx = 0; this.mouse.ty = 0; };
    box.addEventListener('pointermove', this.onMove);
    box.addEventListener('pointerleave', this.onLeave);
    if ('ResizeObserver' in window) { this.ro = new ResizeObserver(() => this.handleResize()); this.ro.observe(box); }
    if ('IntersectionObserver' in window) {
      this.io = new IntersectionObserver((es) => { this.visible = es[0].isIntersecting; });
      this.io.observe(box);
    }
    const reduce = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    const t0 = performance.now();
    const frame = (now) => {
      if (this.dead) return;
      if (this.visible || reduce) {
        this.mouse.x += (this.mouse.tx - this.mouse.x) * 0.05;
        this.mouse.y += (this.mouse.ty - this.mouse.y) * 0.05;
        if (this.animateScene) this.animateScene(reduce ? 2 : (now - t0) / 1000);
        renderer.render(scene, camera);
      }
      if (!reduce) this.raf = requestAnimationFrame(frame);
    };
    this.raf = requestAnimationFrame(frame);
  }
  handleResize() {
    const w = this.box.offsetWidth, h = this.box.offsetHeight;
    if (!this.renderer || !w || !h) return;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  }
}
function start(box) {
  if (box.__jomouh || !window.THREE) return;
  try { const s = new JomouhScene(box); box.__jomouh = s; s.init(); } catch (e) { /* WebGL unavailable: keep the plain background */ }
}
function boot() {
  const boxes = document.querySelectorAll('[data-scene]');
  if (!boxes.length) return;
  if (!('IntersectionObserver' in window)) { boxes.forEach(start); return; }
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => { if (e.isIntersecting) { start(e.target); io.unobserve(e.target); } });
  }, { rootMargin: '300px 0px' });
  boxes.forEach((b) => io.observe(b));
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
