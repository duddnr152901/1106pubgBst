// 2D 캔버스 벚꽃 (스프라이트 방식)
(function () {
  function makePetal() {
    const S = 128, c = document.createElement('canvas'); c.width = c.height = S;
    const x = c.getContext('2d');
    x.translate(S / 2, S / 2);
    const g = x.createRadialGradient(0, 10, 4, 0, 0, S * 0.5);
    g.addColorStop(0, 'rgba(255,246,249,1)'); g.addColorStop(0.55, 'rgba(255,214,228,.95)'); g.addColorStop(1, 'rgba(246,168,196,.9)');
    x.fillStyle = g;
    x.beginPath();
    x.moveTo(0, 50);
    x.bezierCurveTo(-46, 22, -44, -34, -10, -50);
    x.quadraticCurveTo(0, -38, 0, -38);
    x.quadraticCurveTo(0, -38, 10, -50);
    x.bezierCurveTo(44, -34, 46, 22, 0, 50);
    x.closePath(); x.fill();
    x.globalAlpha = 0.25; x.strokeStyle = '#e98fb0'; x.lineWidth = 1.5;
    x.beginPath(); x.moveTo(0, 44); x.quadraticCurveTo(2, 0, 0, -34); x.stroke();
    return c;
  }
  window.startSakura = function (canvas, opts) {
    opts = opts || {};
    const ctx = canvas.getContext('2d'), img = makePetal();
    let W = 0, H = 0, dpr = 1;
    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      const r = canvas.getBoundingClientRect(); W = r.width; H = r.height;
      canvas.width = Math.max(1, Math.round(W * dpr)); canvas.height = Math.max(1, Math.round(H * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const ro = new ResizeObserver(resize); ro.observe(canvas);
    const sp = opts.speed || 1, base = opts.size || 26;
    const mk = init => {
      const p = { s: 0.35 + Math.random() * 0.65, r: Math.random() * 6, vr: Math.random() * 0.03,
        vx: (0.5 * (-0.5 + Math.random()) - 1.7) * sp * 0.6, vy: (1.5 + Math.random() * 0.7) * sp * 0.6,
        ph: Math.random() * 6.28, a: 0.55 + Math.random() * 0.45 };
      if (init) { p.x = Math.random() * W; p.y = Math.random() * H; }
      else if (Math.random() > 0.4) { p.x = Math.random() * W; p.y = -base; }
      else { p.x = W + base; p.y = Math.random() * H; }
      return p;
    };
    const P = Array.from({ length: opts.count || 30 }, () => mk(true));
    let raf = 0, running = true, t = 0;
    const frame = () => {
      if (!running) return;
      if (opts.active && !opts.active()) { raf = requestAnimationFrame(frame); return; } // 안 보이는 동안 그리기 생략
      t += 0.016;
      ctx.clearRect(0, 0, W, H);
      for (let i = 0; i < P.length; i++) {
        let p = P[i];
        p.x += p.vx + Math.sin(t * 1.2 + p.ph) * 0.3; p.y += p.vy; p.r += p.vr;
        if (p.x > W + base * 2 || p.x < -base * 2 || p.y > H + base * 2) p = P[i] = mk(false);
        const sz = base * p.s, flip = 0.55 + 0.45 * Math.abs(Math.sin(t * 0.9 + p.ph));
        ctx.save(); ctx.globalAlpha = p.a; ctx.translate(p.x, p.y); ctx.rotate(p.r); ctx.scale(1, flip);
        ctx.drawImage(img, -sz / 2, -sz / 2, sz, sz); ctx.restore();
      }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => { running = false; cancelAnimationFrame(raf); ro.disconnect(); };
  };
})();
