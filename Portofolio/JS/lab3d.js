/* =========================================================
   Lab 3D : modèles Three.js (baie, switch, serveur, Pi, routeur)
   avec reflets, ombres, vue éclatée et fenêtre d'inspection
   ========================================================= */
(() => {
  const { $, $$, reduce, motion, clamp } = window.portfolio;
  const lenis = window.portfolio.lenis;

  /* =====================================================================
     LAB 3D réaliste : matériaux PBR, reflets, ombres douces, vue éclatée
     ===================================================================== */
  function initLab() {
    const cards = $$('.viewer-card');
    if (!window.THREE) {
      cards.forEach(c => { const l = $('.loading', c); if (l) { l.classList.add('err'); l.textContent = "Le module 3D n'a pas pu se charger. Vérifie ta connexion internet."; } });
      $$('.inspect, .explode').forEach(b => b.disabled = true);
      return;
    }
    const T = THREE, HL = 0x16b3b8;
    const MONO = "'JetBrains Mono', ui-monospace, monospace", SANS = "'Manrope', Arial, sans-serif";
    const U = .04445;

    /* ---------- Textures dessinées ---------- */
    function ctex(w, h, draw, o = {}) {
      const c = document.createElement('canvas'); c.width = w; c.height = h;
      const g = c.getContext('2d'); draw(g, w, h);
      const t = new T.CanvasTexture(c);
      if (o.srgb !== false) t.encoding = T.sRGBEncoding;
      t.anisotropy = 8;
      if (o.wrap) t.wrapS = t.wrapT = T.RepeatWrapping;
      return t;
    }
    const TX = {
      brushed: ctex(512, 512, (g, w, h) => {
        g.fillStyle = '#d2d6d9'; g.fillRect(0, 0, w, h);
        for (let i = 0; i < 5000; i++) {
          const v = 165 + Math.random() * 80 | 0; g.strokeStyle = `rgba(${v},${v},${v + 3},.35)`;
          g.lineWidth = Math.random() * 1.3; const y = Math.random() * h, x = Math.random() * w, l = 30 + Math.random() * 260;
          g.beginPath(); g.moveTo(x, y); g.lineTo(x + l, y); g.stroke();
        }
      }, { wrap: true }),
      holes: ctex(64, 64, (g) => {
        g.fillStyle = '#050607';
        for (const [x, y] of [[16, 16], [48, 16], [0, 48], [32, 48], [64, 48]]) { g.beginPath(); g.arc(x, y, 10, 0, 7); g.fill(); }
      }, { wrap: true }),
      perf: ctex(64, 64, (g) => {
        g.fillStyle = '#fff'; g.fillRect(0, 0, 64, 64); g.fillStyle = '#000';
        for (const [x, y] of [[16, 16], [48, 16], [0, 48], [32, 48], [64, 48]]) { g.beginPath(); g.arc(x, y, 11, 0, 7); g.fill(); }
      }, { wrap: true, srgb: false }),
      slots: ctex(64, 32, (g) => { g.fillStyle = '#07080a'; g.beginPath(); g.roundRect ? g.roundRect(8, 10, 48, 12, 6) : g.rect(8, 10, 48, 12); g.fill(); }, { wrap: true }),
      squares: ctex(32, 96, (g) => { g.fillStyle = '#0a0b0c'; for (let i = 0; i < 3; i++) g.fillRect(9, 9 + i * 32, 14, 14); }, { wrap: true }),
      pins: ctex(64, 16, (g) => { g.fillStyle = '#111'; g.fillRect(0, 0, 64, 16); g.fillStyle = '#e3b24c'; for (let i = 0; i < 8; i++) g.fillRect(2 + i * 8, 0, 4, 16); }),
      glow: ctex(64, 64, (g) => { const r = g.createRadialGradient(32, 32, 0, 32, 32, 32); r.addColorStop(0, 'rgba(255,255,255,1)'); r.addColorStop(.25, 'rgba(255,255,255,.5)'); r.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = r; g.fillRect(0, 0, 64, 64); }),
    };
    function pcbTex(w, h, o = {}) {
      return ctex(w, h, (g) => {
        g.fillStyle = o.color || '#155234'; g.fillRect(0, 0, w, h);
        for (let i = 0; i < w * h / 300; i++) { g.fillStyle = `rgba(0,0,0,${Math.random() * .07})`; g.fillRect(Math.random() * w, Math.random() * h, 3, 3); }
        g.lineCap = 'round'; g.lineJoin = 'round';
        for (let i = 0; i < (o.traces || 160); i++) {
          g.strokeStyle = `rgba(110,200,135,${.16 + Math.random() * .2})`; g.lineWidth = 1 + Math.random() * 2.2;
          let x = Math.random() * w, y = Math.random() * h; g.beginPath(); g.moveTo(x, y);
          for (let k = 0; k < 4; k++) {
            const d = 20 + Math.random() * 140, dir = Math.random() * 4 | 0, diag = Math.random() < .35 ? d * .7 : 0;
            if (dir === 0) { x += d; y += diag; } else if (dir === 1) { x -= d; y -= diag; } else if (dir === 2) { y += d; x += diag; } else { y -= d; x -= diag; }
            g.lineTo(x, y);
          }
          g.stroke(); g.fillStyle = '#caa24a'; g.beginPath(); g.arc(x, y, 3, 0, 7); g.fill();
        }
        for (let i = 0; i < 260; i++) { g.fillStyle = '#b8954a'; g.beginPath(); g.arc(Math.random() * w, Math.random() * h, 2, 0, 7); g.fill(); }
        g.fillStyle = 'rgba(244,244,236,.92)'; g.strokeStyle = 'rgba(244,244,236,.8)'; g.lineWidth = 2;
        (o.text || []).forEach(([t, x, y, fs = 20, rot = 0]) => { g.save(); g.translate(x * w, y * h); g.rotate(rot); g.font = `700 ${fs}px ${MONO}`; g.fillText(t, 0, 0); g.restore(); });
        (o.boxes || []).forEach(([x, y, bw, bh]) => g.strokeRect(x * w, y * h, bw * w, bh * h));
      });
    }

    /* ---------- Matériaux ---------- */
    const P = {
      paint: { color: 0x2a2f35, roughness: .48, metalness: .35, clearcoat: .25, clearcoatRoughness: .45 },
      frame: { color: 0x1c1f23, roughness: .5, metalness: .4, clearcoat: .15 },
      black: { color: 0x101215, roughness: .55, metalness: .05 },
      void: { color: 0x010101, roughness: 1, metalness: 0 },
      alu: { color: 0xffffff, roughness: .38, metalness: 1, map: TX.brushed },
      steel: { color: 0xdfe3e6, roughness: .42, metalness: .85, map: TX.brushed },
      nickel: { color: 0xd9dee3, roughness: .2, metalness: 1 },
      gold: { color: 0xe6b450, roughness: .22, metalness: 1 },
      copper: { color: 0xd8875a, roughness: .28, metalness: 1 },
      white: { color: 0xf2f4f6, roughness: .22, metalness: 0, clearcoat: .9, clearcoatRoughness: .15 },
      plastic: { color: 0x1b1d21, roughness: .42, metalness: 0, clearcoat: .3, clearcoatRoughness: .5 },
      rubber: { color: 0x141619, roughness: .85, metalness: 0 },
      green: { color: 0x17563a, roughness: .5, metalness: 0, clearcoat: .4, clearcoatRoughness: .35 },
      boot: { color: 0xe6eef3, roughness: .12, metalness: 0, transparent: true, opacity: .5, clearcoat: 1 },
      glass: { color: 0x9fc9e0, roughness: .05, metalness: 0, transparent: true, opacity: .22, clearcoat: 1 },
      cable: { color: 0x2f7de1, roughness: .45, metalness: 0, clearcoat: .35, clearcoatRoughness: .4 },
    };
    const mk = (k, o = {}) => { const m = new T.MeshPhysicalMaterial(Object.assign({}, P[k], o)); m.color.convertSRGBToLinear(); m.emissive.convertSRGBToLinear(); return m; };
    const MAT = {
      pins: new T.MeshStandardMaterial({ map: TX.pins, roughness: .3, metalness: .8 }),
      holes: new T.MeshStandardMaterial({ map: TX.holes, transparent: true, roughness: .8, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 }),
      slots: new T.MeshStandardMaterial({ map: TX.slots, transparent: true, roughness: .8, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 }),
      squares: new T.MeshStandardMaterial({ map: TX.squares, transparent: true, roughness: .8, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 }),
    };

    /* ---------- Géométries ---------- */
    const GC = new Map();
    function geoBox(w, h, d, r) {
      const key = [w, h, d, r].map(n => n.toFixed(5)).join('|');
      if (GC.has(key)) return GC.get(key);
      let g;
      const rr = Math.min(r, w / 2 - 1e-5, h / 2 - 1e-5, d / 2 - 1e-5);
      if (T.RoundedBoxGeometry && rr > 0.0002 && Math.min(w, h, d) > .005) g = new T.RoundedBoxGeometry(w, h, d, 2, rr);
      else g = new T.BoxGeometry(w, h, d);
      GC.set(key, g); return g;
    }
    function box(p, [w, h, d], [x, y, z], m, r = 0) { const o = new T.Mesh(geoBox(w, h, d, r), m); o.position.set(x, y, z); p.add(o); return o; }
    function cyl(p, r, h, [x, y, z], m, axis = 'y', seg = r > .01 ? 28 : 14, r2) {
      const o = new T.Mesh(new T.CylinderGeometry(r2 ?? r, r, h, seg), m); o.position.set(x, y, z);
      if (axis === 'z') o.rotation.x = Math.PI / 2; else if (axis === 'x') o.rotation.z = Math.PI / 2; else if (axis === '-z') o.rotation.x = -Math.PI / 2;
      p.add(o); return o;
    }
    function plane(p, w, h, [x, y, z], m, o = {}) {
      const g = new T.PlaneGeometry(w, h);
      if (o.uv || o.rep) { const sx = o.rep ? o.rep[0] : w * o.uv, sy = o.rep ? o.rep[1] : h * o.uv, uv = g.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * sx, uv.getY(i) * sy); }
      const pl = new T.Mesh(g, m); pl.position.set(x, y, z);
      pl.rotation.set(o.rx || 0, o.ry || 0, o.rz || 0); p.add(pl); return pl;
    }
    const deco = (o) => { o.userData.noGlow = true; o.userData.noShadow = true; return o; };
    const holes = (p, w, h, pos, o = {}) => deco(plane(p, w, h, pos, MAT.holes, Object.assign({ uv: o.density || 600 }, o)));
    function textPlane(p, w, h, pos, draw, o = {}) {
      const res = o.res || 2048, ch = Math.max(16, Math.round(res * h / w)), k = res / w;
      const tex = ctex(res, ch, (g) => { g.textBaseline = 'middle'; draw(g, k, (x) => (x + w / 2) * k, (y) => (h / 2 - y) * k); });
      const m = new T.MeshStandardMaterial({ map: tex, transparent: true, roughness: .6, metalness: 0, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -4 });
      if (o.emissive) { m.emissive = new T.Color(0xffffff); m.emissiveMap = tex; m.emissiveIntensity = o.emissive; }
      return deco(plane(p, w, h, pos, m, o));
    }
    const font = (g, k, size, weight = 700, fam = MONO) => { g.font = `${weight} ${Math.max(6, size * k)}px ${fam}`; };
    function tube(p, pts, color, r = .0028, seg = 40) {
      const curve = new T.CatmullRomCurve3(pts.map(a => new T.Vector3(...a)), false, 'centripetal');
      const o = new T.Mesh(new T.TubeGeometry(curve, seg, r, 7, false), mk('cable', { color })); p.add(o); return o;
    }
    const screw = (p, x, y, z) => { cyl(p, .0031, .0014, [x, y, z + .0007], mk('nickel'), 'z', 20); box(p, [.004, .0007, .0003], [x, y, z + .0015], mk('void')); };

    const part = (p, ctx, label, info, ex) => {
      const g = new T.Group(); g.userData = { label, info, ex }; p.add(g); ctx.parts.push(g); return g;
    };
    // Les voyants ne sont plus des objets séparés : on note leur position,
    // puis ils sont tous dessinés d'un coup (InstancedMesh + Points) dans buildLeds().
    function led(p, ctx, [x, y, z], color, s = .0026, o = {}) {
      const mk = new T.Object3D(); mk.position.set(x, y, z + .0006); mk.userData.led = true; p.add(mk);
      ctx.leds.push({ mk, s, color: new T.Color(color).convertSRGBToLinear(), f: o.f ?? (3 + Math.random() * 14), p: Math.random() * 6.3, th: o.th ?? (-.3 + Math.random() * .9) });
    }
    function rj45(p, x, y, z, flip = false, frame = 'black') {
      const s = flip ? -1 : 1;
      box(p, [.0152, .0132, .0014], [x, y, z + .0007], mk(frame, { roughness: .5 }), .0006);
      box(p, [.0117, .0086, .0004], [x, y - s * .0006, z + .0015], mk('void'));
      box(p, [.0046, .0019, .0004], [x, y + s * .0047, z + .0015], mk('void'));
      deco(plane(p, .0082, .0017, [x, y - s * .0033, z + .0018], MAT.pins));
    }
    function plug(p, [x, y, z], color, dir = 1) {
      box(p, [.0116, .0083, .02], [x, y, z + dir * .009], mk('boot'), .0012);
      deco(plane(p, .008, .0016, [x, y - .0026, z + dir * .0005], MAT.pins, { ry: dir > 0 ? 0 : Math.PI }));
      box(p, [.0128, .0098, .016], [x, y, z + dir * .026], mk('cable', { color }), .0035);
      return [x, y, z + dir * .033];
    }
    function cord(p, a, b, color, bulge = .05) {
      const s = plug(p, a, color), e = plug(p, b, color);
      tube(p, [s, [s[0], s[1] - .006, s[2] + bulge * .5], [(s[0] + e[0]) / 2, (s[1] + e[1]) / 2, s[2] + bulge], [e[0], e[1] + .006, e[2] + bulge * .5], e], color, .0027);
    }
    function sfpCage(p, x, y, z) {
      box(p, [.0142, .0098, .0016], [x, y, z + .0008], mk('nickel'), .0005);
      box(p, [.0122, .0078, .0004], [x, y, z + .0017], mk('void'));
    }
    function ears(p, h, z, y = 0, color = 'paint') {
      box(p, [.4826, h - .0008, .0025], [0, y, z - .00125], mk(color), .0012);
      const rows = h > U * 1.5 ? [-1, 1] : [0];
      for (const sx of [-1, 1]) for (const sy of rows) screw(p, sx * .2325, y + sy * (h / 2 - .009), z);
    }
    function caddyLFF(p, ctx, x, y, z) {
      box(p, [.1, .0252, .004], [x, y, z + .002], mk('plastic', { color: 0x202328 }), .0012);
      holes(p, .06, .016, [x - .01, y, z + .0042], { density: 1100 });
      box(p, [.02, .0195, .003], [x + .036, y, z + .0055], mk('nickel'), .0012);
      box(p, [.012, .004, .001], [x + .036, y, z + .0072], mk('void'));
      led(p, ctx, [x - .045, y + .007, z + .0041], 0x3aa8ff, .0019);
      led(p, ctx, [x - .045, y - .007, z + .0041], 0x37e27a, .0019, { th: -2 });
    }
    function caddySFF(p, ctx, x, y, z) {
      box(p, [.0142, .07, .004], [x, y, z + .002], mk('plastic', { color: 0x25282d }), .001);
      holes(p, .009, .04, [x, y + .009, z + .0042], { density: 1300 });
      box(p, [.011, .017, .003], [x, y - .024, z + .0055], mk('nickel'), .001);
      led(p, ctx, [x - .0035, y + .032, z + .0041], 0x3aa8ff, .0017);
      led(p, ctx, [x + .0035, y + .032, z + .0041], 0x37e27a, .0017, { th: -2 });
    }

    /* Façade de switch 24 ports, partagée entre la baie et le modèle seul */
    function switchFront(p, ctx, zF, yc, name) {
      const colX = (c) => -.150 + c * .0165 + Math.floor(c / 6) * .008;
      const pos = [];
      for (let i = 0; i < 24; i++) {
        const c = i >> 1, top = i % 2 === 0, x = colX(c), y = yc + (top ? .0077 : -.0077);
        rj45(p, x, y, zF, !top); pos.push([x, y]);
        const ly = yc + (top ? .0166 : -.0166);
        led(p, ctx, [x - .004, ly, zF], i % 9 === 4 ? 0xffa20a : 0x37e27a, .0024);
        led(p, ctx, [x + .0035, ly, zF], 0xffa20a, .0024, { th: .75 });
      }
      for (let i = 0; i < 4; i++) sfpCage(p, .066 + (i >> 1) * .0175, yc + (i % 2 ? -.0072 : .0072), zF);
      rj45(p, .106, yc + .0077, zF);
      box(p, [.0154, .0012, .0006], [.106, yc + .0151, zF + .0005], mk('plastic', { color: 0x2f7de1 }));
      box(p, [.0125, .0055, .0016], [.106, yc - .009, zF + .0008], mk('nickel'), .0004); box(p, [.0105, .0035, .0004], [.106, yc - .009, zF + .0017], mk('void'));
      cyl(p, .0018, .0016, [.121, yc - .011, zF + .0008], mk('plastic', { color: 0x30343a }), 'z');
      const st = [['SYS', .0, { f: 1.6, th: -.4 }], ['PWR', .0, { th: -2 }], ['FAN', 0, { th: -2 }], ['PoE', 0, { th: .2, f: .7 }]];
      st.forEach(([n], i) => led(p, ctx, [-.199 + (i % 2) * .016, yc + (i < 2 ? .008 : -.004), zF], i === 3 ? 0xffa20a : 0x37e27a, .0026, st[i][2]));
      textPlane(p, .44, .042, [0, yc, zF + .0003], (g, k, X, Y) => {
        g.fillStyle = 'rgba(235,240,244,.88)'; font(g, k, .0021, 600);
        for (let i = 0; i < 24; i++) { const [x] = pos[i]; const top = i % 2 === 0; g.textAlign = 'left'; g.fillText(String(i + 1), X(x + .0062), Y(yc + (top ? .0166 : -.0166))); }
        ['25', '26', '27', '28'].forEach((n, i) => { g.textAlign = 'center'; g.fillText(n, X(.066 + (i >> 1) * .0175), Y(yc + (i % 2 ? -.0145 : .0145))); });
        font(g, k, .0019, 700); g.textAlign = 'center'; g.fillText('CONSOLE', X(.106), Y(yc + .0178)); g.fillText('USB', X(.106), Y(yc - .0145)); g.fillText('MODE', X(.121), Y(yc - .0165));
        g.textAlign = 'left'; st.forEach(([n], i) => g.fillText(n, X(-.196 + (i % 2) * .016), Y(yc + (i < 2 ? .008 : -.004))));
        font(g, k, .0042, 800, SANS); g.fillStyle = 'rgba(245,248,250,.95)'; g.textAlign = 'right'; g.fillText(name, X(.205), Y(yc + .007));
        font(g, k, .0021, 600); g.fillStyle = 'rgba(235,240,244,.7)'; g.fillText('24× 10/100/1000 PoE+ · 4× SFP', X(.205), Y(yc - .004));
        g.fillText('GIGABIT MANAGED SWITCH', X(.205), Y(yc - .011));
      }, { res: 4096 });
      return pos;
    }

    /* ---------- Modèles ---------- */
    const CAB = [0x2f7de1, 0xf2c14e, 0xe0533d, 0x3cb371, 0x9b59b6, 0xf28c28, 0xeeeeee];
    const MODELS = {
      rack: {
        title: 'Baie de serveurs', spec: 'Rack 19" · 22U · 600 × 800 mm', yaw: -.62, pitch: .14, explode: [0, 0, 1],
        build(g, ctx) {
          const W = .6, D = .8, N = 22, y0 = .1, H = y0 + N * U + .05, Zf = D / 2 - .09, BD = .5;
          const yAt = (u, h = 1) => y0 + (N - u - h + 1) * U + h * U / 2;
          const dev = (label, info, u, h, color = 'paint') => {
            const p = part(g, ctx, label, info, [0, 0, 1]);
            box(p, [.44, h * U - .0012, BD], [0, yAt(u, h), Zf - BD / 2 - .0025], mk(color, { roughness: .5 }), .002);
            ears(p, h * U, Zf, yAt(u, h), color);
            return p;
          };
          // Structure
          const fr = part(g, ctx, 'Châssis de la baie', "Armoire 19 pouces de 22U (1U = 44,45 mm). Les équipements se vissent sur les montants avant avec des écrous cage.", [0, 0, 0]);
          for (const sx of [-1, 1]) for (const sz of [-1, 1]) box(fr, [.035, H - .06, .035], [sx * (W / 2 - .0175), .06 + (H - .06) / 2, sz * (D / 2 - .0175)], mk('frame'), .004);
          box(fr, [W, .03, D], [0, H - .015, 0], mk('frame'), .006);
          holes(fr, W - .12, D - .2, [0, H + .0002, 0], { rx: -Math.PI / 2, density: 160 });
          textPlane(fr, .12, .024, [-.17, H - .015, D / 2 + .0002], (g2, k, X, Y) => { g2.fillStyle = '#f2f4f6'; g2.fillRect(0, 0, 1e4, 1e4); g2.fillStyle = '#10222b'; font(g2, k, .012, 800, SANS); g2.textAlign = 'center'; g2.fillText('RACK A-01', X(0), Y(0)); }, { res: 512 });
          box(fr, [W, .05, D], [0, .085, 0], mk('frame'), .004);
          for (const sx of [-1, 1]) box(fr, [.008, H - .12, D - .05], [sx * (W / 2 - .006), .06 + (H - .06) / 2, 0], mk('frame', { color: 0x24282d }), .003);
          for (const sx of [-1, 1]) for (const zz of [Zf + .001, -Zf + .02]) {
            box(fr, [.018, N * U, .0025], [sx * .2325, y0 + N * U / 2, zz - .0013], mk('steel'));
            deco(plane(fr, .009, N * U, [sx * .2325, y0 + N * U / 2, zz + .0001], MAT.squares, { rep: [1, N] }));
          }
          for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
            box(fr, [.03, .02, .03], [sx * .24, .05, sz * .33], mk('nickel'), .003);
            cyl(fr, .024, .018, [sx * .24, .025, sz * .33], mk('rubber'), 'x', 32);
          }
          // Porte avant perforée (animée)
          const door = part(g, ctx, 'Porte avant perforée', "Porte en tôle micro-perforée : elle protège le matériel tout en laissant passer l'air froid. Elle ferme à clé.", [1, 0, .6]);
          const hinge = new T.Group(); hinge.position.set(W / 2 - .004, 0, D / 2 + .004); door.add(hinge);
          const dw = W - .01, dh = H - .08, dyc = .06 + dh / 2;
          const perfTex = TX.perf.clone(); perfTex.needsUpdate = true; perfTex.wrapS = perfTex.wrapT = T.RepeatWrapping; perfTex.repeat.set(dw * 140, dh * 140);
          const pm = mk('frame', { alphaMap: perfTex, alphaTest: .5, side: T.DoubleSide });
          box(hinge, [dw - .06, dh - .06, .0015], [-dw / 2, dyc, 0], pm);
          for (const [w2, h2, x2, y2] of [[dw, .03, -dw / 2, dyc + dh / 2 - .015], [dw, .03, -dw / 2, dyc - dh / 2 + .015], [.03, dh, -dw + .015, dyc], [.03, dh, -.015, dyc]]) box(hinge, [w2, h2, .02], [x2, y2, .008], mk('frame'), .004);
          box(hinge, [.016, .14, .02], [-dw + .03, dyc, .025], mk('nickel'), .006);
          cyl(hinge, .005, .004, [-dw + .03, dyc + .045, .036], mk('steel'), 'z');
          for (const yy of [dyc - dh / 2 + .1, dyc + dh / 2 - .1]) cyl(hinge, .007, .05, [0, yy, .006], mk('nickel'));
          ctx.door = hinge;
          // Équipements
          const pp = dev('Panneau de brassage', "Arrivée des câbles des bureaux. Chaque prise numérotée est reliée à une prise murale ; un cordon court la raccorde au switch.", 1, 1, 'black');
          const ppX = (i) => -.192 + i * .0164 + Math.floor(i / 6) * .0036, ppY = yAt(1) - .002;
          for (let i = 0; i < 24; i++) rj45(pp, ppX(i), ppY, Zf);
          textPlane(pp, .44, .04, [0, yAt(1), Zf + .0003], (g2, k, X, Y) => {
            g2.fillStyle = 'rgba(240,242,245,.9)'; font(g2, k, .0026, 700); g2.textAlign = 'center';
            for (let i = 0; i < 24; i++) g2.fillText(String(i + 1), X(ppX(i)), Y(ppY + .0105));
          }, { res: 4096 });
          const br = dev('Passe-câbles à brosse', "Panneau 1U avec une brosse : il guide les cordons de brassage proprement entre le panneau et le switch.", 2, 1, 'black');
          box(br, [.38, .014, .0006], [0, yAt(2), Zf + .0003], mk('void'));
          for (let i = 0; i < 70; i++) box(br, [.0012, .006, .002], [-.188 + i * .0055, yAt(2) + (i % 2 ? .0035 : -.0035), Zf + .001], mk('rubber', { color: 0x0b0c0d }));
          const sw = dev('Switch 24 ports', "Relie tous les équipements du réseau local. Les voyants verts clignotent quand des données passent.", 3, 1, 'paint');
          sw.children[0].material.color.setHex(0x34495a).convertSRGBToLinear(); sw.children[1].material.color.setHex(0x2c3e4d).convertSRGBToLinear();
          const swPos = switchFront(sw, ctx, Zf, yAt(3), 'CIEL-SW24');
          const cords = part(g, ctx, 'Cordons de brassage', "Câbles RJ45 courts (catégorie 6) entre chaque prise du panneau et un port du switch. La couleur indique l'usage : bleu = PC, jaune = téléphones, rouge = serveurs…", [0, 0, 1.6]);
          for (let i = 0; i < 24; i++) { if (i % 3 === 2) continue; cord(cords, [ppX(i), ppY, Zf + .0015], [swPos[i][0], swPos[i][1], Zf + .0015], CAB[(i * 5) % 6], .03 + (i % 4) * .006); }
          const bl = part(g, ctx, 'Panneaux obturateurs', "Bouchent les emplacements vides pour obliger l'air froid à traverser les serveurs au lieu de les contourner.", [0, 0, 1]);
          for (const [u, h] of [[4, 1], [16, 1], [17, 1], [18, 2]]) { ears(bl, h * U, Zf, yAt(u, h), 'black'); }
          const srv = [[5, 'Serveur web', "Héberge les sites et applications internes. 2U, 8 disques 2,5\" remplaçables à chaud.", 'SRV-WEB-01'],
            [7, 'Serveur de fichiers', "Stocke les documents partagés, avec des disques en RAID pour ne rien perdre si un disque tombe en panne.", 'SRV-FILE-01'],
            [9, 'Contrôleur de domaine (AD)', "Gère les comptes, mots de passe et droits d'accès avec Active Directory, ainsi que le DNS interne.", 'SRV-DC-01']];
          for (const [u, label, info, host] of srv) {
            const s = dev(label, info, u, 2, 'paint'); const yc = yAt(u, 2);
            for (let i = 0; i < 8; i++) caddySFF(s, ctx, -.19 + i * .0152, yc, Zf);
            box(s, [.25, .078, .006], [.045, yc, Zf + .003], mk('plastic', { color: 0x1d2024 }), .003);
            holes(s, .23, .06, [.045, yc - .004, Zf + .0062], { density: 520 });
            textPlane(s, .25, .012, [.045, yc + .032, Zf + .0063], (g2, k, X, Y) => { g2.fillStyle = 'rgba(240,244,246,.9)'; font(g2, k, .0055, 800, SANS); g2.textAlign = 'left'; g2.fillText(host, X(-.11), Y(0)); font(g2, k, .0035, 600); g2.textAlign = 'right'; g2.fillText('2U · 2× CPU · 256 GB', X(.11), Y(0)); }, { res: 1024 });
            cyl(s, .0045, .002, [.2, yc + .015, Zf + .001], mk('nickel'), 'z'); led(s, ctx, [.2, yc + .015, Zf + .0012], 0x37e27a, .003, { th: -2 });
            cyl(s, .0032, .002, [.2, yc - .004, Zf + .001], mk('plastic', { color: 0x2f7de1 }), 'z');
            led(s, ctx, [.2, yc - .02, Zf], 0x3aa8ff, .0022);
          }
          const fw = dev('Pare-feu', "Filtre tout ce qui entre et sort du réseau : il bloque les connexions non autorisées venant d'internet et crée les VPN.", 11, 1, 'paint');
          fw.children[0].material.color.setHex(0x5a1d18).convertSRGBToLinear(); fw.children[1].material.color.setHex(0x6b231c).convertSRGBToLinear();
          for (let i = 0; i < 8; i++) { rj45(fw, -.02 + i * .0165, yAt(11) - .002, Zf); led(fw, ctx, [-.02 + i * .0165, yAt(11) + .0125, Zf], 0x37e27a, .0022); }
          for (let i = 0; i < 2; i++) sfpCage(fw, .125 + i * .017, yAt(11) - .002, Zf);
          box(fw, [.06, .02, .002], [-.13, yAt(11), Zf + .001], mk('void'));
          textPlane(fw, .058, .018, [-.13, yAt(11), Zf + .0022], (g2, k, X, Y) => { g2.fillStyle = '#071a10'; g2.fillRect(0, 0, 1e4, 1e4); g2.fillStyle = '#5dff9b'; font(g2, k, .0045, 700); g2.textAlign = 'left'; g2.fillText('FW-EDGE  ONLINE', X(-.026), Y(.004)); g2.fillText('WAN 1.2 Gb/s', X(-.026), Y(-.004)); }, { res: 512, emissive: 1.1 });
          led(fw, ctx, [-.188, yAt(11) + .005, Zf], 0x37e27a, .003, { th: -2 }); led(fw, ctx, [-.188, yAt(11) - .005, Zf], 0xffa20a, .003, { f: 2.2, th: 0 });
          for (const u of [12, 13]) {
            const s1 = dev(u === 12 ? 'Serveur 1U (supervision)' : 'Serveur 1U (sauvegardes)', u === 12 ? "Surveille l'état du réseau et des serveurs, et envoie une alerte en cas de panne." : "Copie chaque nuit les données importantes vers un autre support.", u, 1, 'paint');
            for (let i = 0; i < 4; i++) caddyLFF(s1, ctx, -.155 + i * .101, yAt(u), Zf);
            led(s1, ctx, [.206, yAt(u) + .006, Zf], 0x37e27a, .0026, { th: -2 });
          }
          const nas = dev('Baie de stockage (NAS)', "12 disques 3,5\" en RAID 6 : jusqu'à deux disques peuvent tomber en panne sans perte de données, et on les remplace à chaud.", 14, 2, 'paint');
          for (let c = 0; c < 4; c++) for (let r = 0; r < 3; r++) caddyLFF(nas, ctx, -.153 + c * .1015, yAt(14, 2) + (r - 1) * .0265, Zf);
          const ups = part(g, ctx, 'Onduleur (UPS)', "Batterie de secours : en cas de coupure de courant, il alimente la baie quelques minutes, le temps d'éteindre proprement les serveurs.", [0, 0, 1]);
          const uy = yAt(20, 3);
          box(ups, [.44, 3 * U - .0012, .55], [0, uy, Zf - .275 - .0025], mk('black'), .003); ears(ups, 3 * U, Zf, uy, 'black');
          holes(ups, .13, .1, [-.135, uy, Zf + .0002], { density: 420 }); holes(ups, .13, .1, [.135, uy, Zf + .0002], { density: 420 });
          box(ups, [.09, .05, .003], [0, uy + .02, Zf + .0015], mk('void'), .002);
          textPlane(ups, .084, .044, [0, uy + .02, Zf + .0032], (g2, k, X, Y) => {
            g2.fillStyle = '#04121c'; g2.fillRect(0, 0, 1e4, 1e4); g2.fillStyle = '#7fd8ff'; font(g2, k, .0062, 700); g2.textAlign = 'left';
            g2.fillText('ONLINE', X(-.038), Y(.014)); font(g2, k, .0045, 600); g2.fillText('LOAD   42 %', X(-.038), Y(.002)); g2.fillText('BATT  100 %', X(-.038), Y(-.008)); g2.fillText('OUT  230 V', X(-.038), Y(-.017));
            g2.strokeStyle = '#7fd8ff'; g2.lineWidth = 3; g2.strokeRect(X(.012), Y(.019), .026 * k, .012 * k); for (let i = 0; i < 4; i++) g2.fillRect(X(.014 + i * .006), Y(.017), .0045 * k, .008 * k);
          }, { res: 768, emissive: 1.2 });
          for (let i = 0; i < 4; i++) cyl(ups, .004, .003, [-.027 + i * .018, uy - .024, Zf + .0015], mk('plastic', { color: 0x2b2f35 }), 'z');
          for (let i = 0; i < 3; i++) led(ups, ctx, [.06 + i * .012, uy + .036, Zf], i === 2 ? 0xffa20a : 0x37e27a, .0028, { th: i === 2 ? .9 : -2 });
          textPlane(ups, .1, .01, [0, uy - .038, Zf + .0003], (g2, k, X, Y) => { g2.fillStyle = 'rgba(240,244,246,.85)'; font(g2, k, .005, 800, SANS); g2.textAlign = 'center'; g2.fillText('UPS 1500 VA', X(0), Y(0)); }, { res: 512 });
          const pdu = part(g, ctx, 'Multiprise de baie (PDU)', "Bande d'alimentation verticale à l'arrière : elle distribue le courant de l'onduleur à chaque équipement.", [.8, 0, -.4]);
          box(pdu, [.045, .8, .05], [.255, y0 + .45, -.3], mk('black'), .004);
          for (let i = 0; i < 12; i++) { box(pdu, [.0004, .022, .016], [.2326, y0 + .12 + i * .06, -.3], mk('void')); }
          for (let i = 0; i < 6; i++) tube(pdu, [[.232, y0 + .12 + i * .12, -.3], [.18, y0 + .14 + i * .12, -.29], [.1, yAt(3 + i * 3), -.17], [.05, yAt(3 + i * 3), Zf - BD - .003]], 0x111111, .003);
        }
      },

      switch: {
        title: 'Switch 24 ports', spec: '24 ports Gigabit PoE+ · 4 SFP · 1U', yaw: -.48, pitch: .34, explode: [0, 1, .6],
        build(g, ctx) {
          const W = .44, H = .0435, D = .25, Z = D / 2;
          const b = part(g, ctx, 'Boîtier', "Châssis métal 1U de 44 cm de large. Les grilles latérales et arrière laissent passer l'air des ventilateurs internes.", [0, -.4, -.4]);
          box(b, [W, H - .002, D], [0, 0, 0], mk('paint', { color: 0x34495a }), .0025);
          for (const sx of [-1, 1]) holes(b, .16, .026, [sx * (W / 2 + .0002), 0, -.03], { ry: sx * Math.PI / 2, density: 700 });
          holes(b, .1, .03, [-.1, 0, -Z - .0002], { ry: Math.PI, density: 650 }); holes(b, .1, .03, [.04, 0, -Z - .0002], { ry: Math.PI, density: 650 });
          box(b, [.03, .022, .004], [.16, 0, -Z - .002], mk('black'), .002); box(b, [.022, .013, .002], [.16, 0, -Z - .0045], mk('void'));
          for (const sx of [-1, 1]) for (const sz of [-1, 1]) cyl(b, .007, .004, [sx * .19, -H / 2 - .002, sz * .1], mk('rubber'), 'y', 24);
          textPlane(b, .12, .03, [.0, H / 2 - .001 + .0003, -.06], (g2, k, X, Y) => { g2.fillStyle = 'rgba(230,235,240,.8)'; font(g2, k, .0045, 700); g2.textAlign = 'left'; g2.fillText('MODEL CIEL-SW24P', X(-.055), Y(.008)); font(g2, k, .0033, 500); g2.fillText('100-240V~ 50/60Hz 4A', X(-.055), Y(-.001)); g2.fillText('S/N 2026-0618-0042', X(-.055), Y(-.008)); }, { res: 1024, rx: -Math.PI / 2 });
          const face = part(g, ctx, 'Façade et équerres', "Face avant avec les « oreilles » percées qui servent à visser le switch sur les montants d'une baie 19 pouces.", [0, 0, .5]);
          ears(face, H, Z + .0025, 0, 'paint'); face.children[0].material.color.setHex(0x2b3d4c).convertSRGBToLinear();
          const ports = part(g, ctx, 'Ports RJ45 et voyants', "24 ports Ethernet 1 Gbit/s. Voyant vert : lien actif (il clignote quand des données passent). Voyant orange : le port alimente un appareil en PoE (téléphone IP, borne Wi-Fi, caméra).", [0, 0, 1.1]);
          const pos = switchFront(ports, ctx, Z + .0025, 0, 'CIEL-SW24P');
          const sfp = part(g, ctx, 'Module SFP et fibre optique', "Module optique inséré dans le port 25 : il relie le switch au cœur du réseau par une fibre (câble turquoise), sur des centaines de mètres.", [.4, .5, 1.6]);
          box(sfp, [.0136, .0085, .05], [.066, .0072, Z + .02], mk('alu'), .0008);
          box(sfp, [.0128, .009, .012], [.066, .0072, Z + .05], mk('plastic', { color: 0x30c4d6 }), .002);
          for (const dx of [-.0032, .0032]) tube(sfp, [[.066 + dx, .0072, Z + .056], [.066 + dx, .0072, Z + .09], [.09 + dx, -.005, Z + .14], [.14 + dx, -H / 2 - .002, Z + .2], [.2 + dx, -H / 2 - .002, Z + .3]], 0x30c4d6, .0016);
          const cab = part(g, ctx, 'Câbles réseau', "Câbles RJ45 branchés : chacun relie un PC, une imprimante ou une borne Wi-Fi à ce switch.", [0, -.2, 2]);
          [0, 1, 2, 3, 6, 7, 10, 13, 16, 17, 20, 22].forEach((i, n) => {
            const [x, y] = pos[i], c = CAB[n % CAB.length];
            const e = plug(cab, [x, y, Z + .004], c), side = (x + .05) * .4, fy = -H / 2 - .0005;
            tube(cab, [e, [x, y, Z + .05], [x + side * .5, y - .015, Z + .09], [x + side, fy + .006, Z + .14], [x + side * 1.5, fy, Z + .2], [x + side * 2.2, fy, Z + .3]], c, .0029);
          });
        }
      },

      server: {
        title: 'Serveur 1U ouvert', spec: '2 processeurs · 16 barrettes · 4 disques', yaw: -.55, pitch: .78, explode: [0, 1, 0],
        build(g, ctx) {
          const W = .434, H = .043, D = .7, F = D / 2;
          const ch = part(g, ctx, 'Châssis', "Boîtier en acier de 1U et 70 cm de profondeur. Le capot a été retiré pour voir l'intérieur.", [0, -.25, 0]);
          box(ch, [W, .0015, D], [0, .00075, 0], mk('steel'));
          for (const sx of [-1, 1]) box(ch, [.0012, H, D], [sx * (W / 2 - .0006), H / 2, 0], mk('steel'));
          box(ch, [W, H, .0012], [0, H / 2, -F + .0006], mk('steel'));
          holes(ch, .12, .03, [-.12, H / 2, -F - .0002], { ry: Math.PI, density: 600 });
          const front = part(g, ctx, 'Baies de disques (4)', "Quatre disques 3,5\" remplaçables à chaud par l'avant. Voyant bleu : le disque lit ou écrit.", [0, 0, 1.4]);
          box(front, [W, H, .003], [0, H / 2, F - .0015], mk('paint'), .001);
          for (let i = 0; i < 4; i++) caddyLFF(front, ctx, -.155 + i * .1035, H / 2, F);
          for (let i = 0; i < 4; i++) box(front, [.1, .025, .14], [-.155 + i * .1035, H / 2, F - .075], mk('alu'), .002);
          box(front, [.42, .035, .004], [0, H / 2, F - .152], mk('green'));
          const fanP = part(g, ctx, 'Ventilateurs (7)', "Mur de ventilateurs 40 mm : ils aspirent l'air froid par l'avant et le poussent vers l'arrière à travers les composants.", [0, 1.4, .4]);
          const sq = new T.Shape(); const a = .0198; sq.moveTo(-a, -a); sq.lineTo(a, -a); sq.lineTo(a, a); sq.lineTo(-a, a); sq.lineTo(-a, -a);
          const hole = new T.Path(); hole.absarc(0, 0, .0185, 0, Math.PI * 2, true); sq.holes.push(hole);
          const frameGeo = new T.ExtrudeGeometry(sq, { depth: .028, bevelEnabled: true, bevelSize: .0006, bevelThickness: .0006, bevelSegments: 2, curveSegments: 32 });
          const bladeGeo = new T.BoxGeometry(.0155, .0006, .009); bladeGeo.translate(.0098, 0, 0);
          for (let i = 0; i < 7; i++) {
            const x = -.156 + i * .052, z = F - .19;
            const fm = new T.Mesh(frameGeo, mk('plastic', { color: 0x15171a })); fm.position.set(x, .0215, z - .014); fanP.add(fm);
            const hub = new T.Group(); hub.position.set(x, .0215, z); fanP.add(hub);
            cyl(hub, .0085, .012, [0, 0, 0], mk('plastic', { color: 0x1e2125 }), 'z');
            for (let b = 0; b < 7; b++) { const bl = new T.Mesh(bladeGeo, mk('plastic', { color: 0x1e2125 })); const piv = new T.Group(); piv.rotation.z = b * Math.PI * 2 / 7; bl.rotation.x = .5; piv.add(bl); hub.add(piv); }
            ctx.spin.push({ o: hub, s: 22 + i * 1.3 });
            tube(fanP, [[x + .012, .036, z - .012], [x + .02, .03, z - .03], [x + .02, .006, z - .05]], 0x111111, .0008, 12);
          }
          const mb = part(g, ctx, 'Carte mère', "Le circuit principal : il relie les processeurs, la mémoire, les disques et les cartes d'extension.", [0, .35, 0]);
          const mbTex = pcbTex(1024, 1024, { traces: 260, text: [['CPU1', .14, .64, 26], ['CPU2', .6, .64, 26], ['DIMMA1', .02, .3, 14], ['PCH', .44, .9, 18], ['BIOS', .8, .9, 16], ['SATA0-3', .05, .06, 16]], boxes: [[.1, .38, .26, .32], [.56, .38, .26, .32]] });
          box(mb, [.41, .0016, .42], [0, .007, -.12], mk('green'));
          deco(plane(mb, .41, .42, [0, .0079, -.12], new T.MeshPhysicalMaterial({ map: mbTex, roughness: .45, clearcoat: .6, clearcoatRoughness: .3 }), { rx: -Math.PI / 2 }));
          for (let i = 0; i < 18; i++) cyl(mb, .003, .009, [-.17 + (i % 9) * .007, .0125, (i < 9 ? -.02 : -.24)], mk('alu', { color: 0x30343a }), 'y', 16);
          for (let i = 0; i < 12; i++) box(mb, [.0065, .005, .0065], [.17 - (i % 6) * .009, .0105, i < 6 ? -.02 : -.24], mk('steel', { color: 0x7d858d }), .0008);
          box(mb, [.03, .006, .03], [.0, .011, -.29], mk('alu'), .001);
          for (let f = 0; f < 8; f++) box(mb, [.0008, .008, .03], [-.013 + f * .0037, .018, -.29], mk('alu'));
          const cpu = part(g, ctx, 'Processeurs et dissipateurs (2)', "Deux processeurs sous des dissipateurs passifs : la base en cuivre capte la chaleur, les ailettes en aluminium la libèrent dans le flux d'air.", [0, 2.2, 0]);
          for (const cx of [-.09, .09]) {
            box(cpu, [.078, .004, .1], [cx, .0105, -.13], mk('copper'), .001);
            for (let f = 0; f < 34; f++) box(cpu, [.0005, .022, .1], [cx - .038 + f * .0023, .0235, -.13], mk('alu'));
            box(cpu, [.08, .0012, .1], [cx, .0352, -.13], mk('alu'), .0004);
            for (let h = 0; h < 3; h++) tube(cpu, [[cx - .03 + h * .03, .012, -.08], [cx - .03 + h * .03, .02, -.074], [cx - .03 + h * .03, .03, -.08]], 0xd8875a, .0025, 16).material = mk('copper');
          }
          const ram = part(g, ctx, 'Mémoire RAM (16 barrettes)', "16 barrettes DDR5 de 16 Go réparties autour des deux processeurs : 256 Go de mémoire vive au total.", [0, 1.4, 0]);
          const ramTex = ctex(512, 128, (g2) => { g2.fillStyle = '#1b5a33'; g2.fillRect(0, 0, 512, 128); g2.fillStyle = '#121314'; for (let i = 0; i < 9; i++) g2.fillRect(10 + i * 55, 22, 42, 52); g2.fillStyle = '#d8ab45'; for (let i = 0; i < 120; i++) g2.fillRect(4 + i * 4.2, 108, 2.4, 20); g2.fillStyle = '#eee'; g2.font = '600 12px monospace'; g2.fillText('16GB DDR5-4800 RDIMM', 12, 94); });
          for (const cx of [-.09, .09]) for (const s of [-1, 1]) for (let k = 0; k < 4; k++) {
            const x = cx + s * (.046 + k * .0072);
            box(ram, [.0055, .004, .14], [x, .0099, -.13], mk('black'));
            for (const zz of [-1, 1]) box(ram, [.0058, .006, .006], [x, .011, -.13 + zz * .072], mk('white', { clearcoat: .2 }));
            box(ram, [.133, .031, .0013], [x, .0275, -.13], new T.MeshPhysicalMaterial({ map: ramTex, roughness: .45, clearcoat: .5 })).rotation.y = Math.PI / 2;
          }
          const psu = part(g, ctx, 'Alimentations redondantes (2)', "Deux blocs d'alimentation de 800 W : si l'un tombe en panne, l'autre prend le relais sans coupure. On les change à chaud par l'arrière.", [0, 0, -1.4]);
          for (const x of [.183, .127]) {
            box(psu, [.054, .04, .21], [x, .021, -F + .105], mk('alu'), .0015);
            holes(psu, .03, .03, [x - .006, .021, -F - .0003], { ry: Math.PI, density: 900 });
            box(psu, [.012, .016, .003], [x + .017, .021, -F - .0015], mk('black'), .001); box(psu, [.008, .009, .001], [x + .017, .021, -F - .0032], mk('void'));
            box(psu, [.004, .03, .012], [x - .022, .021, -F - .006], mk('black'), .0015);
            led(psu, ctx, [x + .017, .033, -F - .0002], 0x37e27a, .0024, { th: -2 });
          }
          psu.children.filter(c => c.isSprite || c.userData.led).forEach(c => { c.rotation.y = Math.PI; c.position.z -= .003; });
          const pcie = part(g, ctx, 'Carte réseau 10 Gb (PCIe)', "Carte d'extension couchée sur une carte « riser » : elle ajoute deux ports fibre SFP+ à 10 Gbit/s pour relier le serveur au cœur du réseau.", [0, 1.6, -.8]);
          box(pcie, [.07, .028, .0016], [-.15, .022, -.27], mk('green'));
          const nicTex = pcbTex(512, 256, { traces: 60, text: [['10GbE NIC', .06, .25, 26]] });
          box(pcie, [.13, .0016, .068], [-.13, .033, -.3], mk('green'));
          deco(plane(pcie, .13, .068, [-.13, .0339, -.3], new T.MeshPhysicalMaterial({ map: nicTex, roughness: .45, clearcoat: .5 }), { rx: -Math.PI / 2 }));
          box(pcie, [.03, .008, .03], [-.12, .038, -.3], mk('alu'), .001);
          for (let f = 0; f < 7; f++) box(pcie, [.0008, .006, .03], [-.132 + f * .004, .044, -.3], mk('alu'));
          box(pcie, [.13, .03, .0012], [-.13, .03, -F + .0006], mk('steel'));
          for (const dx of [-.02, .005]) { box(pcie, [.0142, .0098, .02], [-.13 + dx, .03, -F + .008], mk('nickel'), .0005); box(pcie, [.0122, .0078, .0004], [-.13 + dx, .03, -F - .0022], mk('void')); }
          const sata = part(g, ctx, 'Câbles SAS / SATA', "Relient le fond de panier des disques à la carte mère pour transférer les données.", [0, 1, .3]);
          tube(sata, [[-.12, .02, F - .156], [-.12, .028, F - .2], [-.1, .02, F - .26], [-.16, .012, .07]], 0x1f1f22, .0028);
          tube(sata, [[.05, .02, F - .156], [.05, .03, F - .2], [.0, .02, F - .27], [-.02, .012, .06]], 0x1f1f22, .0028);
        }
      },

      pi: {
        title: 'Raspberry Pi', spec: 'Mini-ordinateur 85 × 56 mm · GPIO 40 broches', yaw: -.42, pitch: .7, explode: [0, 1, 0],
        build(g, ctx) {
          const W = .085, D = .056, t = .0014, top = t;
          const pcb = part(g, ctx, 'Circuit imprimé', "Carte de 85 × 56 mm à plusieurs couches de cuivre. Les 4 trous servent à la visser dans un boîtier.", [0, -1.2, 0]);
          box(pcb, [W, t, D], [0, t / 2, 0], mk('green'), .003);
          const tex = pcbTex(1700, 1120, { traces: 220, text: [['GPIO', .18, .2, 34], ['DISPLAY', .05, .6, 24, -Math.PI / 2], ['CAMERA', .52, .9, 24, -Math.PI / 2], ['POWER', .08, .97, 24], ['HDMI0', .26, .97, 24], ['HDMI1', .41, .97, 24], ['AUDIO', .66, .97, 24], ['SBC 4B  v1.5', .3, .78, 30], ['PoE', .79, .16, 24]] });
          deco(plane(pcb, W - .002, D - .002, [0, t + .00005, 0], new T.MeshPhysicalMaterial({ map: tex, roughness: .42, clearcoat: .65, clearcoatRoughness: .25 }), { rx: -Math.PI / 2 }));
          for (const [hx, hz] of [[-W / 2 + .0035, -D / 2 + .0035], [-W / 2 + .0035 + .058, -D / 2 + .0035], [-W / 2 + .0035, D / 2 - .0035], [-W / 2 + .0035 + .058, D / 2 - .0035]]) {
            const ring = new T.Mesh(new T.TorusGeometry(.0024, .0007, 10, 28), mk('gold')); ring.rotation.x = Math.PI / 2; ring.position.set(hx, t + .0001, hz); pcb.add(ring);
            cyl(pcb, .00135, t + .0004, [hx, t / 2, hz], mk('void'), 'y', 20);
          }
          for (let i = 0; i < 120; i++) {
            const x = (Math.random() - .5) * (W - .01), z = (Math.random() - .5) * (D - .01);
            if (x > .02 || (Math.abs(x + .012) < .012 && Math.abs(z) < .012) || z < -D / 2 + .008 || z > D / 2 - .009) continue;
            const big = Math.random() < .2;
            box(pcb, big ? [.003, .0009, .0016] : [.0016, .0006, .0008], [x, t + .0004, z], mk(Math.random() < .5 ? 'black' : 'steel', Math.random() < .3 ? { color: 0x7a5a3a } : {}));
          }
          const soc = part(g, ctx, 'Processeur (SoC)', "Le « cerveau » : processeur ARM quatre cœurs à 1,5 GHz et puce graphique réunis sur une seule puce (System on Chip), sous un capot métallique.", [0, 2.2, 0]);
          box(soc, [.016, .0012, .016], [-.0135, t + .0006, .0035], mk('green', { color: 0x1a3d28 }));
          box(soc, [.0142, .0011, .0142], [-.0135, t + .0017, .0035], mk('nickel', { roughness: .32 }), .0006);
          textPlane(soc, .012, .012, [-.0135, t + .00226, .0035], (g2, k, X, Y) => { g2.fillStyle = 'rgba(60,64,70,.75)'; font(g2, k, .0013, 700); g2.textAlign = 'center'; g2.fillText('ARM SoC', X(0), Y(.002)); font(g2, k, .0009, 500); g2.fillText('QUAD 1.5GHz', X(0), Y(-.0005)); g2.fillText('2619 T3', X(0), Y(-.0028)); }, { res: 256, rx: -Math.PI / 2 });
          const ram = part(g, ctx, 'Mémoire vive (LPDDR4)', "La RAM du Pi (de 1 à 8 Go selon le modèle), soudée juste à côté du processeur pour aller vite.", [0, 2, 0]);
          box(ram, [.01, .001, .015], [.003, t + .0005, .0035], mk('black', { roughness: .4 }), .0003);
          textPlane(ram, .009, .012, [.003, t + .00106, .0035], (g2, k, X, Y) => { g2.fillStyle = 'rgba(200,200,200,.6)'; font(g2, k, .001, 700); g2.textAlign = 'center'; g2.fillText('LPDDR4', X(0), Y(.0015)); g2.fillText('4GB', X(0), Y(-.001)); }, { res: 256, rx: -Math.PI / 2 });
          const usb = part(g, ctx, 'Ports USB (4)', "Deux ports USB 3.0 (intérieur bleu, 10× plus rapides) et deux USB 2.0 pour le clavier, la souris ou une clé USB.", [1.6, .4, 0]);
          [[.0105, 0x2f7de1], [-.0075, 0x15161a]].forEach(([z, col]) => {
            box(usb, [.0175, .0156, .0132], [W / 2 - .0068, t + .0078, z], mk('nickel', { roughness: .28 }), .0006);
            for (const y of [.004, .0115]) { box(usb, [.0006, .0055, .0122], [W / 2 + .0024, t + y, z], mk('void')); box(usb, [.0008, .0017, .0095], [W / 2 + .0026, t + y - .0012, z], mk('plastic', { color: col })); }
          });
          const eth = part(g, ctx, 'Port Ethernet', "Prise RJ45 Gigabit pour brancher le Pi en filaire sur un switch ou une box. Ses deux voyants montrent le lien et l'activité.", [1.6, .4, -.3]);
          box(eth, [.021, .0135, .016], [W / 2 - .0085, t + .00675, -.0225], mk('nickel', { roughness: .28 }), .0006);
          box(eth, [.0006, .0088, .0118], [W / 2 + .0021, t + .0063, -.0225], mk('void'));
          led(eth, ctx, [W / 2 + .0022, t + .012, -.0285], 0x37e27a, .0016); led(eth, ctx, [W / 2 + .0022, t + .012, -.0165], 0xffa20a, .0016);
          eth.children.filter(c => c.isSprite || c.userData.led).forEach(c => { c.rotation.y = Math.PI / 2; });
          const gpio = part(g, ctx, 'Connecteur GPIO (40 broches)', "40 broches au pas de 2,54 mm pour piloter des LED, capteurs, moteurs ou écrans, par exemple en Python.", [0, 2.6, -.6]);
          box(gpio, [.0508, .0025, .0051], [-.0425 + .0035 + .029 - .0005, t + .00125, -D / 2 + .0035], mk('black'), .0003);
          for (let i = 0; i < 20; i++) for (let r = 0; r < 2; r++) box(gpio, [.00064, .0085, .00064], [-.0425 + .0035 + .029 - .0005 - .0241 + i * .00254, t + .0045, -D / 2 + .0035 - .00127 + r * .00254], mk('gold'));
          const hd = part(g, ctx, 'Ports micro-HDMI (2)', "Deux sorties vidéo pour brancher jusqu'à deux écrans en 4K.", [0, .3, 1.6]);
          for (const x of [-.0425 + .026, -.0425 + .0395]) { box(hd, [.0068, .003, .0075], [x, t + .0015, D / 2 - .0025], mk('nickel'), .0006); box(hd, [.0052, .0016, .0006], [x, t + .0015, D / 2 + .0012], mk('void')); }
          const pw = part(g, ctx, 'Alimentation USB-C', "Prise d'alimentation : un chargeur USB-C de 5 V / 3 A (15 W) fait tourner le Pi.", [0, .3, 1.6]);
          box(pw, [.009, .0032, .0073], [-.0425 + .0112, t + .0016, D / 2 - .002], mk('nickel'), .0012); box(pw, [.0075, .0017, .0006], [-.0425 + .0112, t + .0016, D / 2 + .0016], mk('void'), .0006);
          const au = part(g, ctx, 'Prise audio / vidéo', "Prise jack 3,5 mm : sortie son et vidéo composite.", [0, .3, 1.6]);
          box(au, [.007, .006, .012], [-.0425 + .0535, t + .003, D / 2 - .006], mk('black'), .001); cyl(au, .003, .0022, [-.0425 + .0535, t + .003, D / 2 + .0005], mk('black'), 'z'); cyl(au, .0017, .0024, [-.0425 + .0535, t + .003, D / 2 + .0007], mk('void'), 'z');
          const ffc = part(g, ctx, 'Connecteurs caméra et écran', "Connecteurs pour nappes souples : un pour la caméra officielle (CSI), un pour un écran tactile (DSI).", [0, 1.8, 0]);
          box(ffc, [.0225, .0055, .003], [.0145, t + .00275, .012], mk('white', { color: 0xf3f0e8, clearcoat: .1 }), .0004).rotation.y = Math.PI / 2;
          box(ffc, [.0225, .0012, .0035], [.0145, t + .006, .012], mk('black'), .0003).rotation.y = Math.PI / 2;
          box(ffc, [.0225, .0055, .003], [-.0395, t + .00275, -.0005], mk('white', { color: 0xf3f0e8, clearcoat: .1 }), .0004).rotation.y = Math.PI / 2;
          box(ffc, [.0225, .0012, .0035], [-.0395, t + .006, -.0005], mk('black'), .0003).rotation.y = Math.PI / 2;
          const wifi = part(g, ctx, 'Module Wi-Fi / Bluetooth', "Puce radio sous un blindage métallique, avec une petite antenne gravée sur la carte, pour se connecter sans fil.", [0, 2, 0]);
          box(wifi, [.012, .0012, .01], [-.031, t + .0006, .0115], mk('nickel', { roughness: .35 }), .0004);
          const poe = part(g, ctx, 'Broches PoE', "4 broches pour une carte additionnelle qui alimente le Pi directement par le câble réseau (Power over Ethernet).", [0, 2, -.4]);
          box(poe, [.0051, .0025, .0051], [.0265, t + .00125, -.016], mk('black')); for (let i = 0; i < 4; i++) box(poe, [.00064, .0085, .00064], [.0252 + (i % 2) * .00254, t + .0045, -.0172 + (i >> 1) * .00254], mk('gold'));
          const lv = part(g, ctx, 'Voyants', "Rouge fixe : le Pi est alimenté. Vert qui clignote : il lit ou écrit sur la carte microSD.", [-1.4, 1, 0]);
          led(lv, ctx, [-W / 2 + .0028, t + .0004, .015], 0xff3b30, .0016, { th: -2 }); led(lv, ctx, [-W / 2 + .0028, t + .0004, .0115], 0x37e27a, .0016, { f: 11 });
          lv.children.forEach(c => { if (c.userData.led) c.rotation.x = -Math.PI / 2; });
          const sd = part(g, ctx, 'Carte microSD', "Glissée sous la carte : elle contient le système (Raspberry Pi OS) et tous les fichiers.", [-1, -1.6, 0]);
          box(sd, [.0115, .0014, .012], [-W / 2 + .007, -.0007, 0], mk('nickel'), .0004);
          box(sd, [.015, .0008, .011], [-W / 2 + .0035, -.0016, 0], mk('plastic', { color: 0x1d2c6b }), .0006);
        }
      },

      router: {
        title: 'Routeur Wi-Fi', spec: 'Wi-Fi 6 · 4 antennes · 4 LAN + 1 WAN', yaw: -.7, pitch: .36, explode: [0, 1, 0],
        build(g, ctx) {
          const W = .26, H = .036, D = .17;
          const b = part(g, ctx, 'Boîtier', "Coque en plastique brillant avec des fentes d'aération sur le dessus pour refroidir les puces.", [0, -.3, 0]);
          box(b, [W, H, D], [0, 0, 0], mk('white'), .012);
          deco(plane(b, .17, .1, [0, H / 2 + .0002, -.01], MAT.slots, { rx: -Math.PI / 2, uv: 220 }));
          textPlane(b, .08, .014, [0, H / 2 + .0003, .055], (g2, k, X, Y) => { g2.fillStyle = 'rgba(40,50,60,.55)'; font(g2, k, .007, 800, SANS); g2.textAlign = 'center'; g2.fillText('AX3000', X(0), Y(0)); }, { res: 512, rx: -Math.PI / 2 });
          for (const sx of [-1, 1]) for (const sz of [-1, 1]) cyl(b, .007, .004, [sx * .1, -H / 2 - .002, sz * .06], mk('rubber'));
          const ant = part(g, ctx, 'Antennes Wi-Fi (4)', "Émettent et reçoivent le signal en 2,4 GHz et 5 GHz. On les oriente différemment pour mieux couvrir toutes les pièces.", [0, 1, -.6]);
          [-.09, -.03, .03, .09].forEach((x, i) => {
            const base = new T.Group(); base.position.set(x, .006, -D / 2 - .003); ant.add(base);
            box(base, [.014, .016, .012], [0, 0, -.004], mk('black', { color: 0x1a1c1f }), .004);
            cyl(base, .0055, .014, [0, 0, -.009], mk('nickel'), 'x', 24);
            const rod = new T.Group(); rod.position.set(0, 0, -.009); base.add(rod);
            cyl(rod, .0065, .15, [0, .08, 0], mk('black', { color: 0x1a1c1f, roughness: .5 }), 'y', 28, .0055);
            const cap = new T.Mesh(new T.SphereGeometry(.0055, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), mk('black', { color: 0x1a1c1f, roughness: .5 })); cap.position.y = .155; rod.add(cap);
            box(rod, [.009, .012, .009], [0, .008, 0], mk('black', { color: 0x1a1c1f }), .003);
            rod.rotation.z = (i - 1.5) * .16; rod.rotation.x = -.12;
            ctx.sway.push({ o: rod, base: rod.rotation.z, p: i });
          });
          const lv = part(g, ctx, 'Voyants', "Alimentation, internet, Wi-Fi 2,4 GHz, Wi-Fi 5 GHz, réseau local et WPS. Ils clignotent quand des données passent.", [0, .3, 1.4]);
          const names = ['⏻', 'WAN', '2.4G', '5G', 'LAN', 'WPS'];
          for (let i = 0; i < 6; i++) led(lv, ctx, [-.05 + i * .02, -.003, D / 2 + .0002], i === 1 ? 0x37e27a : 0x3aa8ff, .0028, i === 0 ? { th: -2 } : { f: 2 + Math.random() * 10 });
          textPlane(lv, .14, .012, [0, .006, D / 2 + .0004], (g2, k, X, Y) => { g2.fillStyle = 'rgba(60,70,80,.75)'; font(g2, k, .0034, 700); g2.textAlign = 'center'; names.forEach((n, i) => g2.fillText(n, X(-.05 + i * .02), Y(0))); }, { res: 1024 });
          const lan = part(g, ctx, 'Ports LAN (4)', "Ports jaunes pour brancher en câble les appareils du réseau local : PC, console, télé, imprimante…", [0, 0, -1.3]);
          const back = -D / 2;
          for (let i = 0; i < 4; i++) { const x = -.01 + i * .019; const pg = new T.Group(); pg.rotation.y = Math.PI; pg.position.set(0, 0, 0); lan.add(pg); rj45(pg, -x, -.004, -back, false, 'plastic'); pg.children[0].material.color.setHex(0xf2c14e).convertSRGBToLinear(); }
          const wan = part(g, ctx, 'Port WAN', "Port bleu relié à la box ou au modem fibre : c'est l'arrivée d'internet.", [0, 0, -1.3]);
          const wg = new T.Group(); wg.rotation.y = Math.PI; wan.add(wg); rj45(wg, .04, -.004, -back, false, 'plastic'); wg.children[0].material.color.setHex(0x2f7de1).convertSRGBToLinear();
          const pw = part(g, ctx, 'Alimentation, USB et reset', "Prise du bloc secteur 12 V, port USB pour partager un disque, et petit trou « reset » pour revenir à la configuration d'usine.", [0, 0, -1.3]);
          cyl(pw, .005, .006, [.105, -.004, back - .002], mk('black'), 'z'); cyl(pw, .0028, .007, [.105, -.004, back - .0025], mk('void'), 'z');
          box(pw, [.0125, .0055, .002], [-.07, -.004, back - .001], mk('nickel'), .0005); box(pw, [.0105, .0035, .0005], [-.07, -.004, back - .0022], mk('void'));
          cyl(pw, .0011, .001, [-.09, -.004, back - .0005], mk('void'), 'z');
          box(pw, [.01, .006, .003], [.085, -.004, back - .0015], mk('black'), .002);
          textPlane(pw, .22, .01, [0, .0085, back - .0003], (g2, k, X, Y) => { g2.fillStyle = 'rgba(60,70,80,.75)'; font(g2, k, .003, 700); g2.textAlign = 'center'; [['RESET', -.09], ['USB', -.07], ['WAN', -.04], ['LAN1', -.01], ['LAN2', .009], ['LAN3', .028], ['LAN4', .047], ['ON/OFF', .085], ['12V', .105]].forEach(([n, wx]) => g2.fillText(n, X(-wx), Y(0))); }, { res: 2048, ry: Math.PI });
          const cab = part(g, ctx, 'Câbles branchés', "Un câble bleu vers la box internet (WAN) et un câble jaune vers un PC (LAN), plus l'alimentation.", [0, -.2, -2]);
          const wp = plug(cab, [-.04, -.004, back - .002], 0x2f7de1, -1);
          tube(cab, [wp, [-.04, -.004, back - .05], [-.06, -.012, back - .09], [-.09, -H / 2 - .001, back - .14], [-.12, -H / 2 - .001, back - .22]], 0x2f7de1, .0029);
          const lp = plug(cab, [.009, -.004, back - .002], 0xf2c14e, -1);
          tube(cab, [lp, [.009, -.004, back - .05], [.025, -.012, back - .09], [.04, -H / 2 - .001, back - .14], [.06, -H / 2 - .001, back - .22]], 0xf2c14e, .0029);
          tube(cab, [[.105, -.004, back - .006], [.105, -.004, back - .04], [.115, -.012, back - .08], [.13, -H / 2 - .001, back - .13], [.15, -H / 2 - .001, back - .2]], 0x111111, .0022);
        }
      }
    };

    /* ---------- Visionneuse ---------- */
    const ray = new T.Raycaster(), ndc = new T.Vector2();
    const viewers = [];
    const ease = (x) => 1 - Math.pow(1 - x, 3);

    function glow(p, on) {
      if (!p) return;
      p.traverse(m => {
        if (!m.isMesh || m.userData.led || m.userData.noGlow || !m.material.emissive) return;
        if (m.userData.e0 === undefined) { m.userData.e0 = m.material.emissive.getHex(); m.userData.ei0 = m.material.emissiveIntensity; }
        if (on) { m.material.emissive.setHex(HL); m.material.emissiveIntensity = .28; }
        else { m.material.emissive.setHex(m.userData.e0); m.material.emissiveIntensity = m.userData.ei0; }
      });
    }
    function ghost(v, keep) {
      v.ctx.parts.forEach(p => {
        const hide = keep && p !== keep;
        p.traverse(m => {
          const M = m.material; if (!M) return;
          if (M.userData.o0 === undefined) { M.userData.o0 = M.opacity; M.userData.t0 = M.transparent; M.userData.dw0 = M.depthWrite; }
          if (hide) { M.transparent = true; M.opacity = M.userData.o0 * .08; M.depthWrite = false; }
          else { M.transparent = M.userData.t0; M.opacity = M.userData.o0; M.depthWrite = M.userData.dw0; }
          M.needsUpdate = true;
        });
      });
      v.isolated = keep || null; v.shadowDirty = true; colorLeds(v, performance.now() / 1000);
      $('#mIsolate').textContent = keep ? 'Tout afficher' : 'Isoler la pièce';
    }
    function setHover(v, p) {
      if (v.hover === p) return;
      if (v.hover && v.hover !== v.sel) glow(v.hover, false);
      v.hover = p;
      if (p) glow(p, true);
      v.canvas.style.cursor = p ? 'pointer' : '';
      v.tip.classList.toggle('show', !!p);
      if (p) v.tip.textContent = p.userData.label;
    }
    function select(v, p) {
      if (v.sel && v.sel !== p) glow(v.sel, false);
      v.sel = p;
      if (p) glow(p, true);
      const lbl = p ? p.userData.label : null;
      v.info.innerHTML = p ? `<b>${lbl}</b> · ${p.userData.info}` : "Survole une pièce pour l'identifier.";
      if (v.modal) {
        const d = $('#mDetail');
        d.innerHTML = p ? `<b>${lbl}</b><p>${p.userData.info}</p>` : "<b>Choisis une pièce</b><p>Sa fonction s'affichera ici.</p>";
        d.classList.remove('flash'); void d.offsetWidth; d.classList.add('flash');
        $$('#mParts button').forEach(btn => btn.classList.toggle('on', btn.textContent === lbl));
        $('#mIsolate').disabled = !p;
        if (v.isolated && p) ghost(v, p);
      }
    }
    function pick(v, e) {
      const r = v.canvas.getBoundingClientRect();
      ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
      ray.setFromCamera(ndc, v.cam);
      const hits = ray.intersectObjects(v.root.children, true);
      for (const h of hits) {
        let o = h.object; while (o && !o.userData.label) o = o.parent;
        if (!o) continue;
        if (v.isolated && o !== v.isolated) continue;
        return o;
      }
      return null;
    }
    function resize(v) {
      const host = v.canvas.parentElement, w = host.clientWidth, h = host.clientHeight;
      if (!w || !h) return;
      v.renderer.setPixelRatio(Math.max(.6, Math.min(devicePixelRatio || 1, v.modal ? 1.75 : 1.25) * quality));
      v.renderer.setSize(w, h, false);
      v.cam.aspect = w / h; v.cam.updateProjectionMatrix();
      v.base = v.fit / Math.min(1, v.cam.aspect * 1.05);
    }
    function setExplode(v, x) { v.tEx = clamp(x, 0, 1); if (v.modal) $('#mExplode').value = Math.round(v.tEx * 100); updExBtn(v); }
    function updExBtn(v) { const b = $('.explode', v.card); b.textContent = v.tEx > .01 ? 'Rassembler' : 'Éclater'; b.setAttribute('aria-pressed', v.tEx > .01); }

    const lowEnd = (navigator.hardwareConcurrency || 4) <= 4 || matchMedia('(pointer: coarse)').matches;
    let quality = lowEnd ? .8 : 1;

    // Fusionne les pièces qui partagent le même matériau : des milliers d'objets
    // deviennent quelques dizaines, ce qui divise énormément le travail de la carte graphique.
    function mergeStatic(root3) {
      const BGU = T.BufferGeometryUtils; if (!BGU) return;
      root3.updateMatrixWorld(true);
      const groups = []; root3.traverse(o => { if (o.isGroup) groups.push(o); });
      for (const g of groups) {
        const buckets = new Map();
        for (const m of g.children) {
          if (!m.isMesh || m.isInstancedMesh) continue;
          const M = m.material, G = m.geometry;
          const key = [M.type, M.color && M.color.getHexString(), M.emissive && M.emissive.getHexString(), M.emissiveIntensity, M.roughness, M.metalness, M.clearcoat || 0,
            M.map ? M.map.uuid : '', M.alphaMap ? M.alphaMap.uuid : '', M.emissiveMap ? M.emissiveMap.uuid : '', M.transparent, M.opacity, M.side, M.alphaTest, M.depthWrite, M.polygonOffset,
            !!G.index, Object.keys(G.attributes).sort().join(','), m.userData.noShadow ? 1 : 0, m.userData.noGlow ? 1 : 0, M === MAT.pins || M === MAT.holes || M === MAT.slots || M === MAT.squares ? M.uuid : ''].join('|');
          if (!buckets.has(key)) buckets.set(key, []);
          buckets.get(key).push(m);
        }
        for (const list of buckets.values()) {
          if (list.length < 2) continue;
          const geos = list.map(m => { m.updateMatrix(); const gg = m.geometry.clone(); gg.applyMatrix4(m.matrix); return gg; });
          const merged = BGU.mergeBufferGeometries(geos, false);
          geos.forEach(x => x.dispose());
          if (!merged) continue;
          const mm = new T.Mesh(merged, list[0].material);
          mm.userData = Object.assign({}, list[0].userData);
          list.forEach(m => g.remove(m));
          g.add(mm);
        }
      }
    }

    function buildLeds(v) {
      const L = v.ctx.leds; if (!L.length) return;
      v.root.updateMatrixWorld(true);
      const tmp = new T.Vector3();
      L.forEach(l => {
        l.pos = v.root.worldToLocal(l.mk.getWorldPosition(tmp.clone()));
        let o = l.mk.parent; while (o && !o.userData.label) o = o.parent;
        l.part = o; l.mk.parent.remove(l.mk); delete l.mk;
      });
      const im = new T.InstancedMesh(new T.BoxGeometry(1, .75, .6), new T.MeshBasicMaterial({ toneMapped: false }), L.length);
      im.instanceColor = new T.InstancedBufferAttribute(new Float32Array(L.length * 3), 3);
      im.frustumCulled = false; im.raycast = () => {};
      const avg = L.reduce((a, l) => a + l.s, 0) / L.length;
      const pg = new T.BufferGeometry();
      pg.setAttribute('position', new T.BufferAttribute(new Float32Array(L.length * 3), 3));
      pg.setAttribute('color', new T.BufferAttribute(new Float32Array(L.length * 3), 3));
      const pts = new T.Points(pg, new T.PointsMaterial({ size: avg * 6, map: TX.glow, vertexColors: true, transparent: true, depthWrite: false, blending: T.AdditiveBlending, sizeAttenuation: true, toneMapped: false }));
      pts.frustumCulled = false; pts.raycast = () => {};
      v.root.add(im); v.root.add(pts);
      v.leds = { im, pts, L, dummy: new T.Object3D(), off: new T.Color(0x151515) };
      placeLeds(v); colorLeds(v, 0);
    }
    function placeLeds(v) {
      if (!v.leds) return;
      const { im, pts, L, dummy } = v.leds, pos = pts.geometry.attributes.position;
      L.forEach((l, i) => {
        const P = l.part;
        dummy.position.copy(l.pos);
        if (P) dummy.position.add(P.position).sub(P.userData.p0);
        dummy.scale.setScalar(l.s); dummy.updateMatrix();
        im.setMatrixAt(i, dummy.matrix);
        pos.setXYZ(i, dummy.position.x, dummy.position.y, dummy.position.z + l.s * .6);
      });
      im.instanceMatrix.needsUpdate = true; pos.needsUpdate = true;
    }
    function colorLeds(v, t) {
      if (!v.leds) return;
      const { im, pts, L, off } = v.leds, col = pts.geometry.attributes.color, c = new T.Color();
      L.forEach((l, i) => {
        const hidden = v.isolated && l.part !== v.isolated;
        const on = !hidden && (reduce ? l.th < 0 : Math.sin(t * l.f + l.p) > l.th);
        c.copy(on ? l.color : off).multiplyScalar(on ? 2.2 : 1);
        if (hidden) c.setRGB(0, 0, 0);
        im.setColorAt(i, c);
        const g = on ? .9 : 0; col.setXYZ(i, l.color.r * g, l.color.g * g, l.color.b * g);
      });
      im.instanceColor.needsUpdate = true; col.needsUpdate = true;
    }

    function create(card) {
      const def = MODELS[card.dataset.model], stage = $('.stage', card);
      const renderer = new T.WebGLRenderer({ antialias: !lowEnd, alpha: true, powerPreference: 'high-performance' });
      renderer.outputEncoding = T.sRGBEncoding;
      renderer.toneMapping = T.ACESFilmicToneMapping; renderer.toneMappingExposure = 1;
      renderer.shadowMap.enabled = true; renderer.shadowMap.type = T.PCFSoftShadowMap; renderer.shadowMap.autoUpdate = false;
      const canvas = renderer.domElement; canvas.className = 'gl';
      stage.prepend(canvas);
      const ld = $('.loading', stage); if (ld) ld.remove();
      const scene = new T.Scene();
      if (T.RoomEnvironment) {
        const pm = new T.PMREMGenerator(renderer);
        scene.environment = pm.fromScene(new T.RoomEnvironment(), .04).texture; pm.dispose();
      }
      const root3 = new T.Group(); scene.add(root3);
      const ctx = { leds: [], spin: [], sway: [], parts: [] };
      def.build(root3, ctx);
      if (ctx.door) ctx.door.rotation.y = 1.9;
      const bb = new T.Box3().setFromObject(root3), size = bb.getSize(new T.Vector3());
      root3.position.sub(bb.getCenter(new T.Vector3()));
      const rad = bb.getBoundingSphere(new T.Sphere()).radius;
      if (ctx.door) ctx.door.rotation.y = 0;
      mergeStatic(root3);
      root3.updateMatrixWorld(true);
      root3.traverse(o => { if (o.isMesh && !o.userData.noShadow && !(o.material.transparent && o.material.opacity < .6)) { o.castShadow = true; o.receiveShadow = true; } });
      // explosion : position de départ et direction de chaque pièce
      const center = new T.Vector3();
      ctx.parts.forEach((p, i) => {
        p.userData.p0 = p.position.clone();
        const pb = new T.Box3().setFromObject(p), c = pb.isEmpty() ? new T.Vector3() : pb.getCenter(new T.Vector3());
        let dir;
        if (p.userData.ex) dir = new T.Vector3(...p.userData.ex);
        else { dir = c.clone().sub(center); if (dir.lengthSq() < 1e-8) dir.set(0, 1, 0); dir.normalize(); }
        const dd = def.explode && !p.userData.ex ? new T.Vector3(...def.explode) : dir;
        p.userData.dir = dd.multiplyScalar(rad * .5);
      });
      if (card.dataset.model === 'rack') {
        const devs = ctx.parts.filter(p => p.userData.ex && p.userData.ex[2] === 1 && p.userData.ex[0] === 0 && p.userData.ex[1] === 0);
        devs.forEach((p, i) => p.userData.dir.multiplyScalar(.6 + (i % 3) * .35));
      }
      // sol et lumières
      const ground = new T.Mesh(new T.PlaneGeometry(rad * 8, rad * 8), new T.ShadowMaterial({ opacity: .13 }));
      ground.rotation.x = -Math.PI / 2; ground.position.y = -size.y / 2 - rad * .002; ground.receiveShadow = true; scene.add(ground);
      scene.add(new T.HemisphereLight(0xffffff, 0x445566, .2));
      const key = new T.DirectionalLight(0xffffff, 1.6);
      key.position.set(rad * .7, rad * 3.6, rad * 1.1); key.castShadow = true;
      const sc = key.shadow.camera; sc.left = -rad * 1.6; sc.right = rad * 1.6; sc.top = rad * 1.6; sc.bottom = -rad * 1.6; sc.near = rad * .1; sc.far = rad * 8;
      const sm = lowEnd ? 1024 : (card.dataset.model === 'rack' ? 2048 : 1024);
      key.shadow.mapSize.set(sm, sm); key.shadow.bias = -.0004; key.shadow.normalBias = rad * .004;
      scene.add(key);
      const rim = new T.DirectionalLight(0xbfe3ff, .7); rim.position.set(-rad * 2, rad * 1.2, -rad * 2); scene.add(rim);
      const cam = new T.PerspectiveCamera(30, 1, rad * .01, rad * 60);
      const fit = rad / Math.sin(T.MathUtils.degToRad(cam.fov / 2)) * .9;
      const v = {
        card, def, stage, renderer, canvas, scene, cam, root: root3, ctx, fit, base: fit, rad,
        yaw: def.yaw - 1.2, pitch: def.pitch, zoom: 1.7, tYaw: def.yaw, tPitch: def.pitch, tZoom: 1,
        ex: 0, tEx: 0, door: 0, auto: !reduce, visible: false, modal: false, hover: null, sel: null, isolated: null,
        tip: $('.tip', stage), info: $('.info', card), pointers: new Map(), moved: 0, shadowDirty: true, started: false
      };
      if (reduce) { v.yaw = v.tYaw; v.zoom = 1; v.door = 1; }
      buildLeds(v);
      let n = 0; root3.traverse(o => { if (o.isMesh) n++; }); v.drawCalls = n;
      resize(v);

      canvas.addEventListener('pointerdown', (e) => {
        v.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
        try { canvas.setPointerCapture(e.pointerId); } catch (_) {}
        v.drag = true; v.moved = 0; v.auto = false; clearTimeout(v.autoT);
        canvas.parentElement.classList.add('touched');
        if (v.pointers.size === 2) { const [a, b] = [...v.pointers.values()]; v.pinch = Math.hypot(a.x - b.x, a.y - b.y); }
      });
      canvas.addEventListener('pointermove', (e) => {
        const prev = v.pointers.get(e.pointerId);
        if (prev) {
          const dx = e.clientX - prev.x, dy = e.clientY - prev.y;
          prev.x = e.clientX; prev.y = e.clientY;
          if (v.pointers.size === 2) {
            const [a, b] = [...v.pointers.values()], dist = Math.hypot(a.x - b.x, a.y - b.y);
            if (v.pinch) v.tZoom = clamp(v.tZoom * v.pinch / dist, .15, 2.4);
            v.pinch = dist; v.moved += 10; return;
          }
          v.moved += Math.abs(dx) + Math.abs(dy);
          v.tYaw -= dx * .009;
          v.tPitch = clamp(v.tPitch + dy * .007, -1.35, 1.45);
          setHover(v, null);
        } else if (e.pointerType === 'mouse') {
          const p = pick(v, e); setHover(v, p);
          if (p) { const r = v.canvas.getBoundingClientRect(); v.tip.style.left = (e.clientX - r.left) + 'px'; v.tip.style.top = (e.clientY - r.top) + 'px'; }
        }
      });
      const end = (e, cancel) => {
        if (!v.pointers.has(e.pointerId)) return;
        v.pointers.delete(e.pointerId);
        if (v.pointers.size < 2) v.pinch = 0;
        if (v.pointers.size === 0) {
          v.drag = false;
          if (!cancel && v.moved < 6) select(v, pick(v, e));
          v.autoT = setTimeout(() => { if (!v.modal && !reduce) v.auto = true; }, 5000);
        }
      };
      canvas.addEventListener('pointerup', (e) => end(e, false));
      canvas.addEventListener('pointercancel', (e) => end(e, true));
      canvas.addEventListener('pointerleave', (e) => { if (e.pointerType === 'mouse') setHover(v, null); });
      canvas.addEventListener('wheel', (e) => { if (!v.modal) return; e.preventDefault(); v.tZoom = clamp(v.tZoom * (1 + e.deltaY * .0012), .15, 2.4); }, { passive: false });
      $('.inspect', card).addEventListener('click', () => openModal(v));
      $('.explode', card).addEventListener('click', () => setExplode(v, v.tEx > .01 ? 0 : 1));
      viewers.push(v);
      return v;
    }

    /* ---------- Fenêtre d'inspection ---------- */
    const modal = $('#modal'), mStage = $('#mStage');
    let current = null, lastFocus = null;
    function openModal(v) {
      current = v; lastFocus = document.activeElement;
      $('#mTitle').textContent = v.def.title; $('#mSpec').textContent = v.def.spec;
      const list = $('#mParts'); list.innerHTML = '';
      v.ctx.parts.forEach(p => {
        const b = document.createElement('button'); b.type = 'button'; b.textContent = p.userData.label;
        b.addEventListener('mouseenter', () => setHover(v, p));
        b.addEventListener('mouseleave', () => setHover(v, null));
        b.addEventListener('click', () => select(v, p));
        list.appendChild(b);
      });
      modal.hidden = false;
      mStage.prepend(v.canvas);
      v.tip.classList.remove('show'); v.tip = $('.tip', mStage);
      v.modal = true; v.auto = false; v.tZoom = .9;
      $('#mExplode').value = Math.round(v.tEx * 100);
      resize(v); select(v, v.sel);
      if (lenis) lenis.stop();
      document.body.style.overflow = 'hidden';
      requestAnimationFrame(() => modal.classList.add('open'));
      $('#mClose').focus();
    }
    function closeModal() {
      if (!current) return;
      const v = current; current = null;
      if (v.isolated) ghost(v, null);
      modal.classList.remove('open');
      setTimeout(() => {
        modal.hidden = true;
        $('.stage', v.card).prepend(v.canvas);
        v.tip.classList.remove('show'); v.tip = $('.tip', $('.stage', v.card));
        v.modal = false; v.tZoom = 1; v.auto = !reduce;
        setHover(v, null); resize(v);
      }, 300);
      if (lenis) lenis.start();
      document.body.style.overflow = '';
      if (lastFocus) lastFocus.focus();
    }
    $('#mClose').addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });
    addEventListener('keydown', (e) => { if (e.key === 'Escape') closeModal(); });
    $('#mZoomIn').addEventListener('click', () => { if (current) current.tZoom = clamp(current.tZoom * .8, .15, 2.4); });
    $('#mZoomOut').addEventListener('click', () => { if (current) current.tZoom = clamp(current.tZoom * 1.25, .15, 2.4); });
    $('#mReset').addEventListener('click', () => { if (current) { const v = current; v.tYaw = v.def.yaw; v.tPitch = v.def.pitch; v.tZoom = .9; setExplode(v, 0); if (v.isolated) ghost(v, null); select(v, null); } });
    $('#mExplode').addEventListener('input', (e) => { if (current) setExplode(current, e.target.value / 100); });
    $('#mIsolate').addEventListener('click', () => { if (!current) return; const v = current; if (v.isolated) ghost(v, null); else if (v.sel) ghost(v, v.sel); });

    /* ---------- Boucle de rendu ---------- */
    // Chaque modèle n'est construit qu'à l'approche de la section : la page s'ouvre sans à-coup.
    window.portfolio.lab = viewers;   // utile pour mesurer les performances dans la console
    const ro = new ResizeObserver(() => viewers.forEach(resize));
    ro.observe(mStage);
    const vis = new IntersectionObserver(es => es.forEach(e => { const v = viewers.find(x => x.stage === e.target); if (v) v.visible = e.isIntersecting; }), { rootMargin: '120px' });
    const queue = [];
    const build = (c) => {
      if (c._built) return; c._built = true;
      try { const v = create(c); ro.observe(v.stage); vis.observe(v.stage); }
      catch (err) { console.error(err); const l = $('.loading', c); if (l) { l.classList.add('err'); l.textContent = "Ce modèle 3D n'a pas pu s'afficher sur cet appareil."; } }
    };
    const idle = window.requestIdleCallback ? (f) => requestIdleCallback(f, { timeout: 300 }) : (f) => setTimeout(f, 60);
    const pump = () => { const c = queue.shift(); if (!c) return; build(c); if (queue.length) idle(pump); };
    const near = new IntersectionObserver(es => es.forEach(e => {
      if (!e.isIntersecting) return; near.unobserve(e.target);
      queue.push(e.target); if (queue.length === 1) setTimeout(pump, 0);
    }), { rootMargin: '600px 0px' });
    cards.forEach(c => near.observe(c));
    $$('.inspect, .explode').forEach(b => b.addEventListener('pointerdown', () => build(b.closest('.viewer-card')), { capture: true }));

    let last = performance.now(), ema = 16, slowFor = 0, fastFor = 0;
    function adapt(dtMs) {
      ema += (dtMs - ema) * .08;
      if (ema > 24) { slowFor += dtMs; fastFor = 0; } else if (ema < 15) { fastFor += dtMs; slowFor = 0; } else { slowFor = fastFor = 0; }
      if (slowFor > 1200 && quality > .6) { quality = Math.max(.6, quality - .15); slowFor = 0; viewers.forEach(resize); }
      if (fastFor > 4000 && quality < 1) { quality = Math.min(1, quality + .1); fastFor = 0; viewers.forEach(resize); }
    }
    function loop(now) {
      const dtMs = now - last, dt = Math.min(.05, dtMs / 1000); last = now;
      const t = now / 1000, k = 1 - Math.exp(-dt * 7);
      let drew = false;
      for (const v of viewers) {
        if (!(v.visible || v.modal)) continue;
        if (current && !v.modal) continue;               // la fenêtre d'inspection cache les autres modèles
        const busy = v.modal || v.drag || v.hover || Math.abs(v.tEx - v.ex) > .0005 || (v.ctx.door && v.door < 1);
        if (!busy && v.lastDraw && now - v.lastDraw < 32) continue;   // ~30 images/s pour les cartes au repos
        const vdt = v.lastDraw ? Math.min(.05, (now - v.lastDraw) / 1000) : dt; v.lastDraw = now; drew = true;
        if (!v.started) { v.started = true; v.tStart = t; }
        const kv = 1 - Math.exp(-vdt * 7);
        if (v.auto && !v.drag) v.tYaw += vdt * .28 + clamp(motion.vel, -60, 60) * .0009;
        v.yaw += (v.tYaw - v.yaw) * kv; v.pitch += (v.tPitch - v.pitch) * kv; v.zoom += (v.tZoom - v.zoom) * kv;
        // vue éclatée
        const kx = 1 - Math.exp(-vdt * 5);
        if (Math.abs(v.tEx - v.ex) > .0005) {
          v.ex += (v.tEx - v.ex) * (reduce ? 1 : kx);
          const e = ease(v.ex);
          v.ctx.parts.forEach(p => p.position.copy(p.userData.p0).addScaledVector(p.userData.dir, e));
          placeLeds(v); v.shadowDirty = true;
        }
        // ouverture de la porte de la baie
        if (v.ctx.door && v.door < 1) {
          v.door = reduce ? 1 : clamp((t - v.tStart - .6) / 1.8, 0, 1);
          v.ctx.door.rotation.y = ease(v.door) * 1.9; v.shadowDirty = true;
        }
        const d = v.base * v.zoom * (1 + ease(v.ex) * .35);
        v.cam.position.set(Math.sin(v.yaw) * Math.cos(v.pitch) * d, Math.sin(v.pitch) * d, Math.cos(v.yaw) * Math.cos(v.pitch) * d);
        v.cam.lookAt(0, 0, 0);
        if (!reduce) {
          colorLeds(v, t);
          for (const s of v.ctx.spin) s.o.rotation.z += vdt * s.s;
          for (const s of v.ctx.sway) s.o.rotation.z = s.base + Math.sin(t * 1.1 + s.p) * .025;
        }
        if (v.shadowDirty) { v.renderer.shadowMap.needsUpdate = true; v.shadowDirty = false; }
        v.renderer.render(v.scene, v.cam);
      }
      if (drew) adapt(dtMs);
      requestAnimationFrame(loop);
    }
    requestAnimationFrame(loop);
  }
  if (document.readyState === 'complete') initLab(); else addEventListener('load', initLab);
})();
