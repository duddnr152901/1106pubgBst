/* PUBG X PICA PC방 BOOST WEEKEND — 메인 스크립트 */
(function () {
  'use strict';
  // 작업 중 위젯으로 맞춘 배치값 (PC: pos/hidden, 모바일: posM/hiddenM)
  var LAYOUT = {"pos":{"car":{"x":0,"y":3.9,"s":100},"bike-m":{"x":-2.2,"y":1.2,"s":90},"flyer":{"x":5.3,"y":0,"s":100},"explosion":{"x":3.6,"y":0,"s":100}},"hidden":{"bike-m":false,"flyer":false,"supply":true,"bike-f":true,"logo":true},"posM":{"car":{"x":-2.3,"y":-14.5,"s":98},"bg":{"x":2.3,"y":-8.1,"s":100},"title-group":{"x":0,"y":-3.6,"s":100},"bike-m":{"x":-6.1,"y":-11.3,"s":100},"title":{"x":0,"y":0,"s":118}},"hiddenM":{"logo":true}};

  class DCLogic {
    constructor() { this.props = { showWidget: false }; this.state = {}; }
    setState(u, cb) { var p = typeof u === 'function' ? u(this.state) : u; Object.assign(this.state, p); this._render(); if (cb) cb(); }
    forceUpdate() { this._render(); }
    _render() {
      var v = this._vals = this.renderVals();
      document.querySelectorAll('[data-style-tpl]').forEach(function (el) {
        el.setAttribute('style', el.getAttribute('data-style-tpl').replace(/\{\{\s*([\w.]+)\s*\}\}/g, function (m, k) { return v[k] == null ? '' : v[k]; }));
      });
      document.querySelectorAll('[data-text]').forEach(function (el) { var k = el.getAttribute('data-text'); el.textContent = v[k] == null ? '' : v[k]; });
    }
    _bind() {
      var self = this;
      document.querySelectorAll('*').forEach(function (el) {
        Array.prototype.forEach.call(el.attributes, function (at) {
          if (at.name.indexOf('data-on-') !== 0) return;
          var ev = at.name.slice(8), key = at.value;
          el.addEventListener(ev, function (e) { var f = self._vals && self._vals[key]; if (typeof f === 'function') f(e); });
        });
      });
    }
  }

  class Component extends DCLogic {
  state = { shareOpen: false, toastOn: false, toastMsg: '클립보드에 복사되었습니다.', widgetOpen: false, mWidgetOpen: false, mViewOpen: false, mViewIdx: 0, pcViewOpen: false, pcViewIdx: 0, overrides: {}, hidden: {}, pos: {}, hiddenM: {}, posM: {} };

  LAYERS = [
    ['title-group', '타이틀 묶음 (타이틀·문구·기간·CTA)', ''], ['bg', 'KV 배경', 'assets/images/kv/bg.webp'], ['title', '타이틀', 'assets/images/title-set2.webp'], ['logo', 'PUBG 로고', 'assets/images/pubg-logo.webp'],
    ['car', '차 + 캐릭터', 'assets/images/kv/car2.webp'], ['bike-f', '오토바이녀', 'assets/images/kv/bike-f.webp'], ['bike-m', '오토바이남', 'assets/images/kv/bike-m2.webp'],
    ['flyer', '날라다니는애', 'assets/images/kv/flyer.webp'], ['supply', '보급상자', 'assets/images/kv/supply.webp'],
    ['aura-big', '큰 핑크오라', 'assets/images/kv/aura-big.webp'], ['aura-rise', '솟구치는 핑크오라', 'assets/images/kv/aura-rise.webp'], ['aura', '핑크오라', 'assets/images/kv/aura.webp'],
    ['sun-glow', '노란 빛 (효과)', ''], ['explosion', '폭발', 'assets/images/kv/explosion.webp'], ['dust', '먼지', 'assets/images/kv/dust.webp'],
    ['flower-l-blur', '왼쪽 맨앞 블러꽃', 'assets/images/kv/flower-l-blur.webp'], ['flower-l2', '왼쪽꽃2', 'assets/images/kv/flower-l2.webp'], ['flower-r-blur', '오른쪽 블러꽃', 'assets/images/kv/flower-r-blur.webp'],
    ['item-slr', '아이템: 1UP - SLR', 'assets/images/item-slr.webp'], ['item-jumpsuit', '아이템: 지스카 점프수트', 'assets/images/item-jumpsuit.webp']
  ];

  // ── 위젯 저장: 위치/숨김은 localStorage, 교체 이미지는 IndexedDB ──
  LS_KEY = 'pubgBurning.widget.v1';
  saveLS() {
    try { localStorage.setItem(this.LS_KEY, JSON.stringify({ pos: this.state.pos || {}, hidden: this.state.hidden || {}, posM: this.state.posM || {}, hiddenM: this.state.hiddenM || {} })); } catch (e) {}
  }
  idb(mode, fn) {
    return new Promise((res, rej) => {
      const req = indexedDB.open('pubgBurningWidget', 1);
      req.onupgradeneeded = () => req.result.createObjectStore('images');
      req.onerror = () => rej(req.error);
      req.onsuccess = () => { const tx = req.result.transaction('images', mode); const st = tx.objectStore('images'); const r = fn(st); tx.oncomplete = () => res(r && r.result); tx.onerror = () => rej(tx.error); };
    });
  }
  async restoreWidget() {
    let saved = {};
    try { saved = JSON.parse(localStorage.getItem(this.LS_KEY) || '{}'); } catch (e) {}
    const pos = saved.pos || {}, hidden = saved.hidden || {}, posM = saved.posM || {}, hiddenM = saved.hiddenM || {};
    this.setState({ pos, hidden, posM, hiddenM }, () => this.applyAll());
    try {
      const overrides = {};
      await this.idb('readonly', st => {
        const r = st.openCursor();
        r.onsuccess = () => { const c = r.result; if (!c) return; const url = URL.createObjectURL(c.value.blob); overrides[c.key] = { url, name: c.value.name }; this.applyLayerSrc(c.key, url); c.continue(); };
        return null;
      });
      if (Object.keys(overrides).length) this.setState({ overrides });
    } catch (e) {}
  }

  setHidden(el, hide) {
    if (el.dataset.disp === undefined) el.dataset.disp = el.style.display || '';
    el.style.display = hide ? 'none' : el.dataset.disp;
  }
  applyLayerSrc(key, url) {
    document.querySelectorAll('[data-layer="' + key + '"]').forEach(el => { if (el.tagName === 'IMG') el.src = url; });
    document.querySelectorAll('[data-layer-mask="' + key + '"]').forEach(el => { el.style.maskImage = 'url(' + url + ')'; el.style.webkitMaskImage = 'url(' + url + ')'; });
  }
  pickLayer(key, e) {
    const f = e.target.files && e.target.files[0];
    if (!f) return;
    const url = URL.createObjectURL(f);
    const prev = this.state.overrides[key];
    if (prev) URL.revokeObjectURL(prev.url);
    this.applyLayerSrc(key, url);
    this.pendingImgs = Object.assign(this.pendingImgs || {}, { [key]: f });
    this.setState(s => ({ overrides: Object.assign({}, s.overrides, { [key]: { url, name: f.name } }) }));
    e.target.value = '';
  }
  // KV 스테이지 안 레이어는 스테이지 % 기준(margin), 그 외(타이틀/로고/아이템)는 vw/vh 기준(translate)으로 이동
  applyLayerPos(key, x, y, sc) {
    const k = sc == null ? 100 : sc;
    document.querySelectorAll('[data-layer="' + key + '"],[data-layer-mask="' + key + '"]').forEach(el => {
      if (el.closest('#curtainBg')) return;
      if (el.dataset.bsc === undefined) el.dataset.bsc = getComputedStyle(el).scale;
      if (!x && !y && k === 100) { el.style.marginLeft = el.style.marginTop = el.style.scale = el.style.translate = ''; return; }
      // 고정된 기본 위치(CSS left/top) 위에 위젯 값을 margin 으로 더함 → 슬라이더 0 = 현재 고정 위치
      const bsc = parseFloat(el.dataset.bsc) || 1;
      el.style.scale = String(+(bsc * k / 100).toFixed(4));
      if (el.closest('#kvStage') || key === 'bg') { el.style.marginLeft = x + '%'; el.style.marginTop = y * 0.5625 + '%'; }
      else el.style.translate = x + 'vw ' + y + 'vh';
    });
  }
  // 현재 화면(모바일/PC)에 맞는 위치·숨김 세트를 모든 레이어에 적용
  applyAll() {
    if (!this.mq) return;
    const m = this.isMobile;
    // PC 배치는 파일에 고정(잠금) — PC에서는 저장값을 적용하지 않음
    const pos = (m ? this.state.posM : this.state.pos) || {}, hid = (m ? this.state.hiddenM : this.state.hidden) || {};
    this.LAYERS.forEach(([k]) => {
      const p = pos[k] || {};
      this.applyLayerPos(k, p.x || 0, p.y || 0, p.s);
      document.querySelectorAll('[data-layer="' + k + '"],[data-layer-mask="' + k + '"]').forEach(el => { if (!el.closest('#curtainBg')) this.setHidden(el, hid[k]); });
    });
  }
  moveLayer(key, axis, v, mobile) {
    const f = mobile ? 'posM' : 'pos';
    const cur = Object.assign({ x: 0, y: 0, s: 100 }, (this.state[f] || {})[key]);
    cur[axis] = axis === 's' ? Math.round(v) : Math.round(v * 10) / 10;
    if (!!mobile === this.isMobile) this.applyLayerPos(key, cur.x, cur.y, cur.s);
    this.setState(s => ({ [f]: Object.assign({}, s[f] || {}, { [key]: cur }) }));
  }
  resetPosOf(key, mobile) {
    const f = mobile ? 'posM' : 'pos';
    if (!!mobile === this.isMobile) this.applyLayerPos(key, 0, 0);
    this.setState(s => { const p = Object.assign({}, s[f] || {}); delete p[key]; return { [f]: p }; });
  }
  resetMobile = () => { this.setState({ posM: {}, hiddenM: {} }, () => this.applyAll()); };
  saveWidget = async () => {
    this.saveLS();
    const p = this.pendingImgs || {};
    try {
      for (const k of Object.keys(p)) await this.idb('readwrite', st => st.put({ blob: p[k], name: p[k].name }, k));
      this.pendingImgs = {};
      this.showToast('저장되었습니다.');
    } catch (e) { this.showToast('이미지 저장 실패 (위치/숨김은 저장됨)'); }
  };
  toggleLayer(key, mobile) {
    const f = mobile ? 'hiddenM' : 'hidden';
    const hide = !(this.state[f] || {})[key];
    if (!!mobile === this.isMobile) document.querySelectorAll('[data-layer="' + key + '"],[data-layer-mask="' + key + '"]').forEach(el => { if (!el.closest('#curtainBg')) this.setHidden(el, hide); });
    this.setState(s => ({ [f]: Object.assign({}, s[f] || {}, { [key]: hide }) }));
  }
  resetLayers = () => {
    if (!window.confirm('PC·모바일 위치, 숨김, 교체 이미지까지 저장된 값이 모두 지워집니다. 초기화할까요?')) return;
    Object.keys(this.state.hidden || {}).forEach(k => { if ((this.state.hidden || {})[k]) document.querySelectorAll('[data-layer="' + k + '"],[data-layer-mask="' + k + '"]').forEach(el => { this.setHidden(el, false); }); });
    this.setState({ hidden: {} });
    Object.keys(this.state.pos || {}).forEach(k => this.applyLayerPos(k, 0, 0));
    this.setState({ pos: {}, posM: {}, hiddenM: {} }, () => this.applyAll());
    this.idb('readwrite', st => st.clear()).catch(() => {});
    this.pendingImgs = {};
    try { localStorage.removeItem(this.LS_KEY); } catch (e) {}
    this.LAYERS.forEach(([k, , src]) => { const o = this.state.overrides[k]; if (o) { URL.revokeObjectURL(o.url); this.applyLayerSrc(k, src); } });
    this.setState({ overrides: {} });
  };

  // 공유하기 설정 (카카오톡·트위터·네이버 공유 문구/썸네일). [BACKEND] 배포 도메인이 바뀌면 카카오 앱에 사이트 도메인 등록 필요
  SHARE_CONFIG = {
    title: 'PUBG: 배틀그라운드 X 피카플레이 PC방 부스팅 이벤트',
    description: 'PICA PC방에서 단 3일! PUBG: 배틀그라운드를 플레이하고 일일·누적 미션 보상을 모두 획득하세요!',
    kakaoKey: 'd1c0c39f4dbac0062bf36527a3021357', // ics.mediaweb.co.kr용 JavaScript 키
    ogImage: 'https://ics.mediaweb.co.kr/_event/20261106_pubgBst/assets/Thumbnail_1200x630.jpg'
  };

  componentDidMount() {
    const cta = document.getElementById('kvCta');
    if (cta) {
      cta.addEventListener('mouseenter', () => { if (this.isMobile) return; cta.style.filter = 'drop-shadow(0 6px 10px rgba(0,0,0,.6))'; cta.style.transform = 'translateY(-2px)'; });
      cta.addEventListener('mouseleave', () => { if (this.isMobile) return; cta.style.filter = 'drop-shadow(0 6px 10px rgba(0,0,0,.6)) brightness(1.2)'; cta.style.transform = ''; });
    }
    // CTA: 처음 클릭하면 펼치기만(링크 이동 X) → 펼친 뒤 각 칸 클릭 시 이동. 마우스가 벗어나거나 바깥 클릭/Esc면 접힘
    // 펼침(.45s)이 끝난 뒤에만 좌/우 호버 채움 활성화(is-open)
    const btnRow = document.querySelector('.kv-btn-row');
    if (btnRow) {
      let openT;
      const expand = () => { if (btnRow.classList.contains('is-exp')) return; btnRow.classList.add('is-exp'); clearTimeout(openT); openT = setTimeout(() => btnRow.classList.add('is-open'), 450); };
      const collapse = () => { clearTimeout(openT); btnRow.classList.remove('is-exp', 'is-open'); };
      btnRow.addEventListener('click', e => {
        const a = e.target.closest('a'); if (!a) return;
        if (!btnRow.classList.contains('is-exp') && !matchMedia('(hover:none), (max-width: 1024px)').matches) { e.preventDefault(); expand(); }
        if (e.detail > 0) a.blur();
      });
      btnRow.addEventListener('mouseleave', collapse);
      btnRow.addEventListener('focusin', e => { if (e.target.matches(':focus-visible')) expand(); });
      document.addEventListener('click', e => { if (!btnRow.contains(e.target)) collapse(); });
      document.addEventListener('keydown', e => { if (e.key === 'Escape') collapse(); });
    }
    const mm = q => window.matchMedia && window.matchMedia(q);
    this.reduce = mm('(prefers-reduced-motion: reduce)').matches;
    this.mq = mm('(max-width: 1024px)');
    // 화면에 보이는 구간만 애니메이션을 돌리기 위한 가시성 추적 (안 보이는 동안 GPU 부하 제거)
    this.vis = {};
    if ('IntersectionObserver' in window) {
      this.visIO = new IntersectionObserver(es => es.forEach(e => { this.vis[e.target.id] = e.isIntersecting; }));
      ['kv', 'curtainInner'].forEach(id => { const el = document.getElementById(id); if (el) this.visIO.observe(el); });
    }
    { const sc = document.getElementById('kvSakura'); if (sc && window.startSakura && !this.reduce) this.stopSakura = window.startSakura(sc, { count: this.mq.matches ? 18 : 32, speed: 1, active: () => this.curtainShown() }); }
    this.mqTab = mm('(max-width: 1024px)');
    this.onMq = () => { this.applyLayout(); this.applyAll && this.applyAll(); this.forceUpdate(); };
    this.mq.addEventListener('change', this.onMq);
    this.mqTab.addEventListener('change', this.onMq);
    this.applyLayout();
    // 모바일: 헤더 높이가 나중에 바뀌면(웹폰트 로드 후 공지 줄바꿈 변화 등) KV 위치를 다시 맞춤 → 헤더와 KV 사이 빈 띠 방지
    if ('ResizeObserver' in window) {
      this.topRO = new ResizeObserver(() => {
        // 1106 수정 :S — 모바일뿐 아니라 PC 일반 스크롤일 때도 KV 높이 맞춤 (isMobile → flat)
        if (!this.flat) return;
        // 1106 수정 :E
        const kv = document.getElementById('kv'), h = document.getElementById('top').offsetHeight || 80;
        if (kv) { kv.style.marginTop = h + 'px'; kv.style.height = 'calc(100svh - ' + h + 'px)'; }
      });
      this.topRO.observe(document.getElementById('top'));
    }

    window.setPcRoomToggleState = on => {
      const b = document.getElementById('pcRoomToggle'), i = document.getElementById('pcRoomToggleImg');
      if (!b || !i) return;
      b.dataset.state = on ? 'on' : 'off';
      i.src = on ? 'assets/images/off=on.webp' : 'assets/images/off=off.webp';
      i.alt = on ? 'PC방 모드 ON' : 'PC방 모드 OFF';
    };
    try { if (window.Kakao && !Kakao.isInitialized() && this.SHARE_CONFIG.kakaoKey.indexOf('[[') !== 0) Kakao.init(this.SHARE_CONFIG.kakaoKey); } catch (e) {}
    this.onKey = e => { if (e.key === 'Escape' && this.state.shareOpen) this.closeShare(); };
    document.addEventListener('keydown', this.onKey);

    // intro: 초기 오프셋이 한 번 페인트된 뒤 해제
    requestAnimationFrame(() => requestAnimationFrame(() => {
      document.querySelectorAll('[data-intro]').forEach(el => { el.style.transform = 'none'; el.style.opacity = '1'; });
    }));

    this.restoreWidget();
    // 2분마다 자동 새로고침 (index·teaser 공통). 공유 모달이 열려 있으면 닫힐 때까지 10초씩 미룸
    const RELOAD_MS = 2 * 60 * 1000;
    const tryReload = () => { if (this.state.shareOpen) { this.reloadT = setTimeout(tryReload, 10000); return; } location.reload(); };
    this.reloadT = setTimeout(tryReload, RELOAD_MS);
    // this.initMist(); // KV 하단 핑크 안개 — 꺼둠 (다시 켜려면 주석 해제 + 아래 kvMist visibility 복구)
    // 1106 수정 :S
    // this.initSparks(); // 차 앞 총알 튕기는 불꽃 애니메이션 끔
    // 1106 수정 :E
    this.initReveal();
    this.initOdometer();
    this.initKvTransition();
  }

  componentWillUnmount() {
    if (this.stopSakura) this.stopSakura();
    cancelAnimationFrame(this.raf); cancelAnimationFrame(this.petalRaf); cancelAnimationFrame(this.mistRaf); cancelAnimationFrame(this.sparkRaf);
    if (this.onSparkResize) window.removeEventListener('resize', this.onSparkResize);
    if (this.onMistResize) window.removeEventListener('resize', this.onMistResize);
    this.mq.removeEventListener('change', this.onMq);
    this.mqTab.removeEventListener('change', this.onMq);
    document.removeEventListener('keydown', this.onKey);
    document.removeEventListener('mousemove', this.onMouse);
    if (this.onSnapWheel) { window.removeEventListener('wheel', this.onSnapWheel); window.removeEventListener('keydown', this.onSnapKey); window.removeEventListener('scroll', this.onSnapScroll); clearTimeout(this.snapIdleT); }
    window.removeEventListener('resize', this.onResize);
    if (this.io) this.io.disconnect();
    if (this.odoIO) this.odoIO.disconnect();
    if (this.visIO) this.visIO.disconnect();
    if (this.topRO) this.topRO.disconnect();
    clearTimeout(this.reloadT);
  }

  get isMobile() { return this.mq.matches; }
  // 1106 수정 :S — KV→미션 01 스크롤 전환(커튼·자동 스냅)을 끄고 PC도 일반 스크롤. 다시 켜려면 SCROLL_ANIM = true
  SCROLL_ANIM = false;
  get flat() { return this.isMobile || (!this.SCROLL_ANIM && !!document.getElementById('curtain')); }
  // 1106 수정 :E
  // KV: 뷰포트 안이고 커튼에 완전히 덮이지 않았을 때 / 커튼: 뷰포트 안이고 PC에선 걷히기 시작했을 때
  kvShown() { return this.vis.kv !== false && !(this.kvP > 0.995); }
  // 1106 수정 :S — 일반 스크롤이면 미션 01 꽃잎 항상 켬 (isMobile → flat)
  curtainShown() { return this.vis.curtainInner !== false && (this.flat || this.kvP > 0.005); }
  // 1106 수정 :E

  applyLayout() {
    const m = this.isMobile, t = this.mqTab.matches;
    document.querySelectorAll('[data-tr-grid]').forEach(g => { g.style.gridTemplateColumns = m ? 'minmax(0,1fr)' : 'auto minmax(0,1fr)'; const l = g.querySelector('[data-tr-left]'); if (l) { l.style.clipPath = m ? 'polygon(0 0,100% 0,100% calc(100% - 1.5px),0 calc(100% - 1.5px))' : 'polygon(0 0,100% 0,calc(100% - 70px) 100%,0 100%)'; l.style.background = m ? 'transparent' : '#ff4fa3'; const inn = l.firstElementChild; if (inn) { inn.style.clipPath = m ? 'none' : 'polygon(0 0,calc(100% - 1.5px) 0,calc(100% - 71.5px) 100%,0 100%)'; inn.style.paddingRight = m ? 'clamp(22px,3vw,48px)' : 'clamp(100px,9vw,140px)'; inn.style.borderBottom = m ? '1.5px solid #ff4fa3' : ''; } } const r = g.children[1]; if (r) { r.style.justifyContent = m ? 'center' : 'flex-end'; r.style.flexDirection = m ? 'column' : ''; r.style.textAlign = m ? 'center' : ''; r.style.paddingLeft = m ? 'clamp(22px,3vw,48px)' : 'clamp(10px,1.5vw,24px)'; r.style.alignItems = 'center'; } if (l && l.firstElementChild) { const inn = l.firstElementChild; inn.style.alignItems = m ? 'center' : ''; inn.style.textAlign = m ? 'center' : ''; const lab = inn.children[0]; if (lab) { lab.style.fontSize = m ? '18px' : ''; const sl = lab.querySelector('[data-tr-slash]'); if (sl) sl.style.display = m ? 'none' : ''; } const row = inn.children[1]; if (row) { row.style.flexDirection = m ? 'column' : ''; row.style.justifyContent = m ? 'center' : ''; } } });
    { const cs = document.getElementById('couponSteps'); if (cs) { cs.style.gridTemplateColumns = m ? 'minmax(0,1fr)' : 'minmax(0,1fr) auto minmax(0,1fr) auto minmax(0,1fr) auto minmax(0,1fr)'; cs.style.justifyItems = m ? 'center' : ''; cs.querySelectorAll('img').forEach(im => { im.style.rotate = m ? '90deg' : ''; im.style.margin = m ? '-4px 0' : ''; }); cs.querySelectorAll('span').forEach(sp => { sp.style.width = m ? '100%' : ''; sp.style.boxSizing = 'border-box'; }); } }
    document.querySelectorAll('[data-sub-title] > span[aria-hidden]').forEach((el, i) => { el.style.borderWidth = m ? (i % 2 ? '4px 4px 4px 0' : '4px 0 4px 4px') : (i % 2 ? '7px 7px 7px 0' : '7px 0 7px 7px'); });
    const $ = id => document.getElementById(id);
    const set = (id, s) => { const el = $(id); if (!el) return; const o = el.__orig || (el.__orig = {}); Object.keys(s).forEach(k => { if (!(k in o)) o[k] = el.style[k]; el.style[k] = s[k] === '' ? o[k] : s[k]; }); };
    set('top', { height: t ? 'auto' : '80px', minHeight: '80px', padding: t ? (m ? '12px 0' : '10px 0') : '0' });
    set('hdrInner', { gap: t ? (m ? '0' : '2vw') : '48px', padding: t ? (m ? '0 12px' : '0 24px') : '0 40px', flexDirection: m ? 'column' : 'row' });
    set('hdrWrap', { flex: t && !m ? '1 1 0' : 'none', minWidth: '0', justifyContent: m ? 'center' : 'flex-start', width: m ? '100%' : 'auto' });
    set('hdrNotice', { whiteSpace: t ? 'normal' : 'nowrap', wordBreak: 'keep-all', textAlign: m ? 'center' : 'left', fontSize: m ? 'clamp(12px,3.6vw,17px)' : 'clamp(14px,1.25vw,18px)' });
    set('pcRoomToggle', { display: m ? 'none' : 'inline-flex' });
    set('btnShare', { display: m ? 'none' : 'flex' });
    set('mobileFab', { display: m ? 'flex' : 'none' });

    // 커튼(미션 01)이 없는 페이지(사전 홍보 teaser.html)는 스크롤 전환 구간 없이 KV 한 화면
    // 1106 수정 :S — 아래 zone/zoneSticky/kv/curtain 배치는 m 대신 f(일반 스크롤 여부) 기준
    const f = this.flat;
    set('zone', { height: f ? 'auto' : $('curtain') ? '210vh' : '100vh' });
    set('zoneSticky', { position: f ? 'relative' : 'sticky', height: f ? 'auto' : '100vh', overflow: f ? 'visible' : 'hidden' });
    set('kv', f ? { position: 'relative', inset: 'auto', marginTop: (document.getElementById('top').offsetHeight || 80) + 'px', height: 'calc(100svh - ' + (document.getElementById('top').offsetHeight || 80) + 'px)', minHeight: '0' } : { position: 'absolute', inset: '80px 0 0 0', marginTop: '0', height: '', minHeight: '' });
    // 1106 수정 :E
    set('kvBrandRow', { zoom: m ? '0.8' : '' });
    document.querySelectorAll('[data-mission-label]').forEach(el => { if (el.dataset.fs0 === undefined) el.dataset.fs0 = el.style.fontSize; el.style.fontSize = m ? '10.5px' : el.dataset.fs0; });
    document.querySelectorAll('[data-mission-title]').forEach(el => { if (el.dataset.fs0 === undefined) el.dataset.fs0 = el.style.fontSize; el.style.fontSize = m ? '34px' : el.dataset.fs0; });
    set('kvCta', { filter: 'drop-shadow(0 6px 10px rgba(0,0,0,.6)) brightness(1.2)' });
    set('kvDatePc', { display: m ? 'none' : '' });
    set('kvDateMo', { display: m ? 'flex' : 'none' });
    set('kvSubCopy', { fontSize: m ? 'min(4.25vw,17px)' : '', letterSpacing: m ? '-0.02em' : '', lineHeight: m ? '1.5' : '' });
    set('kvSubBr', { display: m ? 'inline' : 'none' });
    set('kvMainTitle', { marginTop: m ? '10px' : '', marginBottom: m ? '6px' : '' });
    set('kvMoBg', { display: m ? 'block' : 'none', cursor: (this.props.showWidget ?? true) ? 'pointer' : 'default' });
    set('kvMist', { visibility: 'hidden' }); // 안개 꺼둠 (원래: m ? 'hidden' : 'visible')
    document.querySelectorAll('[data-layer="sun-glow"],[data-layer="logo"]').forEach(el => { el.style.visibility = m ? 'hidden' : 'visible'; });
    document.querySelectorAll('[data-step-arrow]').forEach(el => { if (el.dataset.h0 === undefined) el.dataset.h0 = el.style.height; Object.assign(el.style, m ? { rotate: '90deg', height: '34px', margin: '-8px 0' } : { rotate: '', height: el.dataset.h0, margin: '' }); if (el.parentElement) { el.parentElement.style.flexDirection = m ? 'column' : ''; Array.from(el.parentElement.children).forEach(c => { if (c !== el && !c.hasAttribute('data-step-arrow')) { if (c.dataset.f0 === undefined) c.dataset.f0 = c.style.flex; c.style.flex = m ? '0 0 auto' : c.dataset.f0; } }); } });
    document.querySelectorAll('[data-layer="supply-drop"],[data-layer="m2-bike"]').forEach(el => { el.style.display = m ? 'none' : ''; });
    set('kvStage', m
      ? { display: 'none' }
      : { display: 'block', top: '50%', bottom: 'auto', width: 'max(100vw,calc((100vh - 80px) * 1.7778))', height: 'max(56.25vw,calc(100vh - 80px))', transform: 'translate(-50%,-50%)' });
    // PC 커튼: 마스크는 고정(CSS), 커튼을 위로 끌어올리고(transform) 안쪽은 반대로 내려 제자리 유지 → 매 프레임 마스크 재계산 없이 GPU 이동만
    // 1106 수정 :S — 커튼도 f 기준 (PC 일반 스크롤일 땐 KV 아래에 그냥 이어 붙음)
    set('curtain', f
      ? { position: 'relative', inset: 'auto', height: 'auto', transform: 'none', maskImage: 'none', webkitMaskImage: 'none', pointerEvents: 'auto' }
      : { position: 'absolute', inset: '0 0 auto 0', height: '', transform: '', maskImage: '', webkitMaskImage: '' });
    set('curtainInner', f ? { position: 'relative', inset: 'auto', height: 'auto', transform: 'none', padding: m ? '72px 20px' : 'clamp(60px,9vh,110px) clamp(20px,6vw,80px)' } : { position: 'absolute', inset: '0 0 auto 0', height: '', transform: '', padding: 'calc(80px + 2vh) clamp(20px,6vw,80px) 4vh' });
    set('curtainBg', f ? { transform: 'scale(1)' } : {});
    // 1106 수정 :E
    set('smoke', { display: m || this.reduce ? 'none' : 'block' });
    if (m) document.querySelectorAll('[data-kv-layer]').forEach(el => { el.style.transform = ''; });
    if (m) document.querySelectorAll('[data-reveal]').forEach(el => { el.style.opacity = '1'; el.style.transform = 'none'; });
    if (this.startLoop) this.startLoop();
    if (this.LAYERS && this.state) this.applyAll();
  }

  initReveal() {
    const els = Array.from(document.querySelectorAll('[data-reveal]'));
    if (this.isMobile || this.reduce || !('IntersectionObserver' in window)) return;
    els.forEach((el, i) => { el.style.opacity = '0'; const rx = el.dataset.revealX; if (rx !== undefined) { el.style.transform = 'translateX(-60px)'; el.style.transitionDelay = rx * 0.15 + 's'; } else { el.style.transform = 'translateY(30px)'; el.style.transitionDelay = (i % 4) * 0.12 + 's'; } });
    this.io = new IntersectionObserver(entries => entries.forEach(e => {
      if (e.isIntersecting) { e.target.style.opacity = '1'; e.target.style.transform = 'none'; this.io.unobserve(e.target); }
    }), { threshold: 0.2 });
    els.forEach(el => this.io.observe(el));
  }

  // 숫자 롤링: 처음 화면에 보일 때 한 번만 자릿수별로 또르르 굴러가 멈춤 (뒷자리일수록 오래, 많이 돎)
  initOdometer() {
    const els = Array.from(document.querySelectorAll('[data-odometer]'));
    if (!els.length || this.reduce || !('IntersectionObserver' in window)) return;
    const reels = new Map();
    els.forEach(el => {
      const txt = el.textContent.trim(); let di = 0; const list = [];
      el.setAttribute('aria-label', txt); el.textContent = ''; el.classList.add('is-odo');
      for (const ch of txt) {
        if (!/\d/.test(ch)) { const c = document.createElement('span'); c.className = 'odo-c'; c.setAttribute('aria-hidden', 'true'); c.textContent = ch; el.appendChild(c); continue; }
        const loops = 2 + di, n = loops * 10 + +ch, d = document.createElement('span'), reel = document.createElement('span');
        d.className = 'odo-d'; d.setAttribute('aria-hidden', 'true'); reel.className = 'odo-reel';
        d.innerHTML = '<span class="odo-w">' + ch + '</span>';
        // 맨 위 칸은 빈칸: 굴러가기 전에는 숫자가 보이지 않음
        for (let k = -1; k <= n; k++) { const g = document.createElement('span'); g.textContent = k < 0 ? ' ' : k % 10; reel.appendChild(g); }
        d.appendChild(reel); el.appendChild(d); list.push({ reel, n, i: di++ });
      }
      reels.set(el, list);
    });
    const roll = (el, on) => {
      if (el.__odoOn === on) return; el.__odoOn = on; el.classList.toggle('odo-on', on);
      reels.get(el).forEach(({ reel, n, i }) => {
        reel.style.transition = on ? 'transform ' + (1.4 + i * 0.3) + 's cubic-bezier(.2,.75,.15,1)' : 'none';
        reel.style.transform = 'translate(-50%,' + (on ? -n - 1 : 0) + 'em)';
      });
    };
    // PC 커튼 안 요소는 뷰포트 안에 있어도 마스크에 가려져 있으므로, 마스크 경계(c±band, 화면 위에서부터 %)가 지나간 뒤에 굴림
    const ratio = new Map(); let mc = -100, mb = 0;
    const update = () => els.forEach(el => {
      if (el.__odoOn) return; // 한 번 굴러간 뒤에는 다시 돌지 않음
      const r = ratio.get(el) || 0; let on = r >= 0.6;
      // 1106 수정 :S — 일반 스크롤이면 커튼 마스크 기다리지 않고 숫자 굴림 (isMobile → flat)
      if (!this.flat && el.closest('#curtain')) { const b = el.getBoundingClientRect(), y = (b.top + b.height / 2) / innerHeight * 100; on = on && y > mc + mb; }
      // 1106 수정 :E
      if (on) roll(el, true);
    });
    this.odoMask = (c, band) => { mc = c; mb = band; update(); };
    this.odoIO = new IntersectionObserver(es => { es.forEach(e => ratio.set(e.target, e.isIntersecting ? e.intersectionRatio : 0)); update(); }, { threshold: [0, 0.6] });
    els.forEach(el => this.odoIO.observe(el));
  }

  initPetals() {
    const cv = document.getElementById('kvPetals');
    if (!cv || this.reduce) return;
    const ctx = cv.getContext('2d');
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    let W = 0, H = 0;
    const size = () => { const r = cv.getBoundingClientRect(); W = r.width; H = r.height; cv.width = W * dpr; cv.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); };
    size();
    const N = this.isMobile ? 18 : 36;
    const mk = init => ({ x: Math.random() * W, y: init ? Math.random() * H : -20, r: 5 + Math.random() * 9, vy: 0.4 + Math.random() * 0.9, vx: 0.3 + Math.random() * 0.8, a: Math.random() * 6.28, va: (Math.random() - 0.5) * 0.04, sw: Math.random() * 6.28, o: 0.55 + Math.random() * 0.4, blur: Math.random() < 0.25 });
    const ps = Array.from({ length: N }, () => mk(true));
    const tick = () => {
      ctx.clearRect(0, 0, W, H);
      ps.forEach((p, i) => {
        p.sw += 0.02; p.a += p.va; p.y += p.vy; p.x += p.vx + Math.sin(p.sw) * 0.6;
        if (p.y > H + 20 || p.x > W + 20) ps[i] = Object.assign(mk(false), { x: Math.random() * W * 0.9 - W * 0.2 });
        ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.a); ctx.scale(1, Math.abs(Math.cos(p.sw)) * 0.6 + 0.4);
        ctx.globalAlpha = p.o; ctx.filter = p.blur ? 'blur(2px)' : 'none';
        const g = ctx.createLinearGradient(-p.r, 0, p.r, 0); g.addColorStop(0, '#ffc2de'); g.addColorStop(1, '#ff7fbf');
        ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(0, 0, p.r, p.r * 0.6, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore();
      });
      this.petalRaf = requestAnimationFrame(tick);
    };
    this.onResize = () => { size(); if (this.resizeSmoke) this.resizeSmoke(); };
    window.addEventListener('resize', this.onResize);
    tick();
  }

  initKvTransition() {
    // 1105 수정 :S
    // PC 미션 01은 화면 높이에 고정된 패널이라, 세로가 낮은 모니터에선 내용이 아래로 잘림 → 넘치면 내용 전체를 비율대로 축소
    const m1Inner = document.getElementById('curtainInner'), m1Box = m1Inner && m1Inner.querySelector('.m1-box-2');
    const fitMission = () => {
      if (!m1Box) return;
      m1Box.style.zoom = '';
      if (this.isMobile) return;
      const cs = getComputedStyle(m1Inner), avail = m1Inner.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom), need = m1Box.offsetHeight;
      if (need > avail && avail > 0) m1Box.style.zoom = (avail / need).toFixed(4);
    };
    fitMission(); window.addEventListener('load', fitMission);
    if (document.fonts) document.fonts.ready.then(fitMission);
    this.onResize = () => { if (this.resizeSmoke) this.resizeSmoke(); fitMission(); }; // fitMission() 추가
    window.addEventListener('resize', this.onResize);
    // 1105 수정 :E
    
    const zone = document.getElementById('zone'), curtain = document.getElementById('curtain'), curtainBg = document.getElementById('curtainBg'), cue = document.getElementById('kvCue');
    if (!zone) return;
    const HOLD_PX = 0, BAND = 45; // 미션 01이 다 드러난 뒤 화면을 붙잡아 두던 구간(600px)은 자동 전환이 생겨 제거
    // 스크롤 줌/팬은 모든 KV 레이어에 동일 적용 (마우스 패럴랙스만 레이어별 depth로 차등)
    // 스크롤 줌은 끔: 전환 중 레이어 배율이 매 프레임 바뀌면 큰 레이어들을 계속 다시 그려야 해서 배경이 비는(분홍 바탕 노출) 원인이 됨
    const SCROLL_ZOOM = 0, SCROLL_PAN = 4;
    const layers = Array.from(document.querySelectorAll('[data-kv-layer]')).map(el => ({ el, depth: (parseFloat(el.dataset.depth) || 0) * (parseFloat(el.dataset.dir) || 1), zoom: parseFloat(el.dataset.zoom) || 0 }));
    const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
    const progress = () => { const total = zone.offsetHeight - window.innerHeight - HOLD_PX; return total <= 0 ? 0 : clamp(-zone.getBoundingClientRect().top / total, 0, 1); };
    let kvMx = 0, kvMy = 0, tx = 0, ty = 0;
    // KV ↔ 미션 01 전환 구간 자동 스크롤: 천천히 스크롤하면 버벅이므로, 구간 안에서 한 번 스크롤하면
    // 끝(미션 01 완전히 드러남) 또는 처음(KV)까지 스르륵 이동. 이동 중 입력은 무시
    const SNAP_MS = 1300;
    const snapRange = () => { const top = zone.getBoundingClientRect().top + window.scrollY, total = zone.offsetHeight - window.innerHeight - HOLD_PX; return [top, top + Math.max(0, total)]; };
    let snapping = false, lastY = window.scrollY;
    const ease = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    const snapTo = y => {
      const y0 = window.scrollY; if (Math.abs(y - y0) < 2) return;
      snapping = true; const t0 = performance.now();
      const step = now => { const k = Math.min(1, (now - t0) / SNAP_MS); window.scrollTo(0, y0 + (y - y0) * ease(k)); if (k < 1) requestAnimationFrame(step); else { snapping = false; lastY = window.scrollY; } };
      requestAnimationFrame(step);
    };
    // 1106 수정 :S — 일반 스크롤이면 자동 스냅 안 함 (isMobile → flat)
    const canSnap = () => !this.flat && !this.reduce && !!curtain;
    // 1106 수정 :E
    this.onSnapWheel = e => {
      if (!canSnap()) return;
      if (snapping) { e.preventDefault(); return; }
      const [a, b] = snapRange(), y = window.scrollY;
      if (e.deltaY > 0 && y >= a - 1 && y < b - 1) { e.preventDefault(); snapTo(b); }
      else if (e.deltaY < 0 && y > a + 1 && y <= b + 1) { e.preventDefault(); snapTo(a); }
    };
    this.onSnapKey = e => {
      if (!canSnap() || /input|textarea/i.test((e.target && e.target.tagName) || '')) return;
      const down = ['ArrowDown', 'PageDown', ' '].includes(e.key), up = ['ArrowUp', 'PageUp'].includes(e.key);
      if (!down && !up) return;
      if (snapping) { e.preventDefault(); return; }
      const [a, b] = snapRange(), y = window.scrollY;
      if (down && y >= a - 1 && y < b - 1) { e.preventDefault(); snapTo(b); }
      else if (up && y > a + 1 && y <= b + 1) { e.preventDefault(); snapTo(a); }
    };
    // 스크롤바 드래그·아래에서 올라오는 경우 등 구간 중간에 멈추면 진행 방향으로 마저 이동
    this.onSnapScroll = () => {
      if (!canSnap() || snapping) { lastY = window.scrollY; return; }
      const [a, b] = snapRange(), y = window.scrollY, dir = y - lastY; lastY = y;
      clearTimeout(this.snapIdleT);
      if (y > a + 2 && y < b - 2) this.snapIdleT = setTimeout(() => { if (!snapping) snapTo(dir >= 0 ? b : a); }, 120);
    };
    window.addEventListener('wheel', this.onSnapWheel, { passive: false });
    window.addEventListener('keydown', this.onSnapKey);
    window.addEventListener('scroll', this.onSnapScroll, { passive: true });
    this.onMouse = e => {
      if (this.reduce || this.isMobile) return;
      const r = zone.getBoundingClientRect();
      if (r.top > window.innerHeight || r.bottom < 0) return;
      tx = clamp(-(((e.clientX - r.left) / r.width - 0.5) * 2), -1, 1);
      ty = clamp(-(((e.clientY - window.innerHeight / 2) / window.innerHeight) * 2), -1, 1);
    };
    // 마우스 대신 자동 좌우 패럴랙스 (레이어별 depth 비율은 동일하게 유지)
    const AUTO_PERIOD = 12; // 한 번 왕복(초)
    const AUTO_Y = 0.3;     // 타원 궤도의 위아래 비율 (좌우 대비, 0이면 좌우만)
    const AUTO_DRIFT = false; // KV 레이어 자동 흔들림(계속 움직이는 패럴랙스) — 꺼둠. true면 전체 레이어 다시 켜짐
    // 1106 수정 :S
    // 맨 앞 차 레이어 흔들림도 끔 (원래: AUTO_DRIFT ? layers : layers.filter(l => l.el.querySelector('.kv-car')))
    const driftLayers = AUTO_DRIFT ? layers : [];
    // 1106 수정 :E
    const renderSmoke = this.initSmoke();
    let lastP = -1, lastH = -1;
    const sticky = document.getElementById('zoneSticky'), curtainInner = document.getElementById('curtainInner');

    const frame = now => {
      if (this.isMobile) { this.raf = 0; return; }
      // 1106 수정 :S — 일반 스크롤이면 진행도 0 고정
      const t = now / 1000, p = this.flat ? 0 : progress();
      // 1106 수정 :E
      this.kvP = p;
      // 스크롤 진행도가 바뀔 때만 커튼 마스크 갱신 (화면 전체 마스크를 매 프레임 다시 그리지 않도록)
      const H = sticky ? sticky.offsetHeight : window.innerHeight;
      // 1106 수정 :S — 일반 스크롤이면 커튼 이동 안 함 (!this.flat 조건 추가)
      if (!this.flat && (p !== lastP || H !== lastH)) {
        // 1106 수정 :E
        const c = -BAND + (1 - p) * (100 + 2 * BAND);
        // 커튼 윗변(= 마스크 투명 시작점)을 (c - BAND)% 위치로. 안쪽 내용은 반대로 이동시켜 화면에 고정
        const off = ((c - BAND) / 100 * H).toFixed(1);
        if (curtain) { curtain.style.transform = 'translate3d(0,' + off + 'px,0)'; curtain.style.pointerEvents = p > 0.9 ? 'auto' : 'none'; }
        if (curtainInner) curtainInner.style.transform = 'translate3d(0,' + (-off) + 'px,0)';
        lastH = H;
        // (커튼 배경 줌아웃 효과는 뺌: 배율이 매 프레임 바뀌면 큰 배경을 계속 다시 그려 버벅임)
        if (cue) cue.style.opacity = Math.max(0, 1 - p / 0.12).toFixed(3);
        if (this.odoMask) this.odoMask(c, BAND);
        lastP = p;
      }
      if (driftLayers.length && !this.reduce && this.kvShown()) {
        tx = Math.sin(t * Math.PI * 2 / AUTO_PERIOD);
        ty = Math.cos(t * Math.PI * 2 / AUTO_PERIOD) * AUTO_Y;
        kvMx += (tx * 3 - kvMx) * 0.08; kvMy += (ty * 3 - kvMy) * 0.08;
        const panY = 0;
        driftLayers.forEach(l => {
          l.el.style.transform = 'translate3d(' + (kvMx * l.depth).toFixed(2) + 'px,' + (kvMy * l.depth).toFixed(2) + 'px,0) scale(' + (1 + SCROLL_ZOOM * p).toFixed(4) + ') translateY(' + (panY * SCROLL_PAN).toFixed(2) + '%)';
        });
      }
      renderSmoke(p, t);
      this.raf = requestAnimationFrame(frame);
    };
    this.startLoop = () => { if (!this.isMobile && !this.raf) this.raf = requestAnimationFrame(frame); };
    this.startLoop();
  }

  // KV 하단 핑크 안개 (simplex noise 도메인 워핑) — 아래에서 위로 갈수록 투명
  initMist() {
    const canvas = document.getElementById('kvMist');
    if (!canvas || this.reduce) { if (canvas) canvas.style.display = 'none'; return; }
    const gl = canvas.getContext('webgl', { alpha: true, premultipliedAlpha: true });
    if (!gl) { canvas.style.display = 'none'; return; }
    const vs = 'attribute vec2 a_pos; void main(){ gl_Position = vec4(a_pos,0.0,1.0); }';
    const fs = `
precision mediump float;
uniform vec2 u_resolution; uniform float u_time; uniform float u_scale;
vec3 permute(vec3 x){ return mod(((x*34.0)+1.0)*x, 289.0); }
float snoise(vec2 v){
  const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
  vec2 i = floor(v + dot(v, C.yy)); vec2 x0 = v - i + dot(i, C.xx);
  vec2 i1 = (x0.x > x0.y) ? vec2(1.0,0.0) : vec2(0.0,1.0);
  vec4 x12 = x0.xyxy + C.xxzz; x12.xy -= i1; i = mod(i, 289.0);
  vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
  vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0); m = m*m; m = m*m;
  vec3 x = 2.0 * fract(p * C.www) - 1.0; vec3 h = abs(x) - 0.5; vec3 ox = floor(x + 0.5); vec3 a0 = x - ox;
  m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);
  vec3 g; g.x = a0.x * x0.x + h.x * x0.y; g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}
void main(){
  vec2 fc = gl_FragCoord.xy / u_scale;
  float t = u_time * 0.4;
  vec2 d1 = vec2(snoise(fc/150.0 + vec2(t*.3, t*.4)), snoise(fc/150.0 + vec2(3.0+t*.4, 4.0+t*.3)));
  vec2 p1 = fc/600.0 + d1*0.2;
  vec2 d2 = vec2(snoise(p1 + vec2(t*-.01, t*-.02)), snoise(p1 + vec2(3.0+t*-.02, 4.0+t*-.3)));
  vec2 p2 = fc/600.0 + d2*0.2;
  float n = (snoise(p2 + vec2(t*-0.12, t*0.02)) + 1.0) / 2.0;
  float y = gl_FragCoord.y / u_resolution.y;
  float fade = pow(clamp(1.0 - y, 0.0, 1.0), 1.8);
  float base = pow(clamp(1.0 - y / 0.35, 0.0, 1.0), 2.0);
  float a = clamp(fade * mix(0.06, 0.42, smoothstep(0.25, 0.85, n)) + base * mix(0.22, 0.38, n), 0.0, 0.58);
  vec3 col = mix(vec3(1.0, 0.95, 0.97), vec3(1.0, 0.88, 0.93), n);
  gl_FragColor = vec4(col * a, a);
}`;
    const compile = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); return s; };
    const prog = gl.createProgram();
    gl.attachShader(prog, compile(gl.VERTEX_SHADER, vs)); gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, fs));
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) { canvas.style.display = 'none'; return; }
    gl.useProgram(prog);
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const aPos = gl.getAttribLocation(prog, 'a_pos'); gl.enableVertexAttribArray(aPos); gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);
    const uRes = gl.getUniformLocation(prog, 'u_resolution'), uTime = gl.getUniformLocation(prog, 'u_time'), uScale = gl.getUniformLocation(prog, 'u_scale');
    const dpr = Math.min(window.devicePixelRatio || 1, 1.25);
    const size = () => { const r = canvas.getBoundingClientRect(); canvas.width = Math.max(1, Math.round(r.width * dpr)); canvas.height = Math.max(1, Math.round(r.height * dpr)); gl.viewport(0, 0, canvas.width, canvas.height); };
    size();
    this.onMistResize = size;
    window.addEventListener('resize', size);
    const t0 = performance.now();
    let last = 0;
    const tick = now => {
      this.mistRaf = requestAnimationFrame(tick);
      if (now - last < 33) return; // 30fps
      last = now;
      const r = canvas.getBoundingClientRect();
      if (r.bottom < 0 || r.top > window.innerHeight) return;
      gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);
      gl.uniform2f(uRes, canvas.width, canvas.height);
      gl.uniform1f(uTime, (now - t0) / 1000);
      gl.uniform1f(uScale, dpr);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    };
    this.mistRaf = requestAnimationFrame(tick);
  }

  // 차량 피탄 스파크 — 3D 좌표(x,y,z) + 원근 투영, 중력·차체 바운스, 모션 블러 꼬리
  initSparks() {
    const cv = document.getElementById('carSparks');
    if (!cv || this.reduce) return;
    const ctx = cv.getContext('2d');
    const dpr = 1; // 스파크는 얇은 선이라 고해상도 불필요 (캔버스가 커서 픽셀 수 절감 효과 큼)
    let W = 1, H = 1;
    const size = () => { const r = cv.getBoundingClientRect(); const sc = parseFloat(cv.style.scale) || 1; W = Math.max(1, r.width / sc); H = Math.max(1, r.height / sc); cv.width = W * dpr; cv.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); };
    size();
    window.addEventListener('resize', size);
    this.onSparkResize = size;

    // 피탄 지점 (차 이미지 기준 %) + 튀는 방향(바깥쪽 법선)
    const HITS = [
      { x: 0.262, y: 0.418, nx: -0.55, ny: -0.75, floor: 0.50 },  // 보닛 왼쪽 앞
      { x: 0.215, y: 0.105, nx: -0.35, ny: -0.9, floor: 0.22 },   // 지붕 앞
      { x: 0.33, y: 0.47, nx: -0.7, ny: -0.5, floor: 0.56 }       // 펜더
    ];
    const FOCAL = 600;
    const sparks = [], flashes = [];
    const burst = (h = HITS[Math.floor(Math.random() * HITS.length)], magK = 1, jx = 0, jy = 0) => {
      // 캔버스는 차 박스보다 사방 30% 크게 잡아서 스파크가 잘리지 않게 함
      const PAD = 0.3, SPAN = 1 + PAD * 2;
      const mag = (0.45 + Math.pow(Math.random(), 1.6) * 0.65) * magK; // 터짐 크기 랜덤 (작게~크게)
      const ox = (PAD + h.x + jx) / SPAN * W, oy = (PAD + h.y + jy) / SPAN * H, s = W / SPAN / 1100 * mag;
      flashes.push({ x: ox, y: oy, life: 1, r: (40 + Math.random() * 30) * s });
      const n = Math.round((10 + Math.random() * 10) * (0.6 + mag * 0.6));
      for (let i = 0; i < n; i++) {
        const spread = (Math.random() - 0.5) * 1.6;
        const ang = Math.atan2(h.ny, h.nx) + spread;
        const sp = (4 + Math.random() * 9) * s;
        sparks.push({
          x: 0, y: 0, z: 0, ox, oy, s,
          vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp, vz: (Math.random() - 0.35) * 10 * s,
          floor: ((PAD + h.floor) / SPAN * H - oy), bounce: 0,
          life: 1, decay: 0.012 + Math.random() * 0.02,
          w: (1 + Math.random() * 1.8) * s, px: null, py: null,
          hue: Math.random() < 0.75 ? 32 + Math.random() * 18 : 330
        });
      }
    };
    const project = p => { const k = FOCAL / (FOCAL + p.z); return [p.ox + p.x * k, p.oy + p.y * k, k]; };
    let next = performance.now() + 600, last = performance.now();
    const tick = now => {
      this.sparkRaf = requestAnimationFrame(tick);
      const dt = Math.min(2.5, (now - last) / 16.67); last = now;
      // KV가 안 보이면 그리지 않고 대기 (남은 스파크는 한 번만 지움)
      if (!this.kvShown()) { if (sparks.length || flashes.length) { sparks.length = flashes.length = 0; ctx.clearRect(0, 0, W, H); } next = Math.max(next, now + 600); return; }
      if (now > next) {
        if (Math.random() < 0.25) {
          // 가끔 점사: 한 지점 근처에 3발 '타타탁' (뒤로 갈수록 살짝 옆으로 밀리며 작아짐)
          const h = HITS[Math.floor(Math.random() * HITS.length)], dir = Math.random() < 0.5 ? -1 : 1;
          for (let k = 0; k < 3; k++) setTimeout(() => burst(h, 0.85 - k * 0.1, dir * k * 0.035, (Math.random() - 0.5) * 0.03), k * (70 + Math.random() * 40));
          next = now + 1800 + Math.random() * 1600;
        } else {
          burst(); if (Math.random() < 0.35) setTimeout(burst, 90 + Math.random() * 120);
          next = now + 1100 + Math.random() * 1600;
        }
      }
      ctx.clearRect(0, 0, W, H);
      ctx.globalCompositeOperation = 'lighter';
      for (let i = flashes.length - 1; i >= 0; i--) {
        const f = flashes[i]; f.life -= 0.09 * dt; if (f.life <= 0) { flashes.splice(i, 1); continue; }
        const g = ctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, f.r * (1.4 - f.life * 0.4));
        g.addColorStop(0, 'rgba(255,250,220,' + (0.95 * f.life) + ')'); g.addColorStop(0.25, 'rgba(255,190,80,' + (0.6 * f.life) + ')'); g.addColorStop(1, 'rgba(255,120,60,0)');
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(f.x, f.y, f.r * 1.4, 0, Math.PI * 2); ctx.fill();
      }
      for (let i = sparks.length - 1; i >= 0; i--) {
        const p = sparks[i];
        p.vy += 0.28 * p.s * dt; p.vx *= Math.pow(0.985, dt); p.vz *= Math.pow(0.985, dt);
        p.x += p.vx * dt; p.y += p.vy * dt; p.z += p.vz * dt;
        if (p.y > p.floor && p.vy > 0) p.life -= 0.12 * dt; // 차체 아래로 떨어지면 빠르게 소멸 (구르기 없음)
        p.life -= p.decay * dt;
        if (p.life <= 0 || p.z < -FOCAL * 0.8) { sparks.splice(i, 1); continue; }
        const [sx, sy, k] = project(p);
        if (p.px !== null) {
          const a = Math.max(0, p.life);
          ctx.strokeStyle = 'hsla(' + p.hue + ',100%,' + (62 + a * 30) + '%,' + a + ')';
          ctx.lineWidth = p.w * k; ctx.lineCap = 'round';
          ctx.shadowColor = p.hue > 300 ? 'rgba(255,100,170,.9)' : 'rgba(255,150,40,.9)'; ctx.shadowBlur = 8 * k;
          ctx.beginPath(); ctx.moveTo(p.px, p.py); ctx.lineTo(sx, sy); ctx.stroke();
        }
        p.px = sx; p.py = sy;
      }
      ctx.shadowBlur = 0; ctx.globalCompositeOperation = 'source-over';
    };
    this.sparkRaf = requestAnimationFrame(tick);
  }

  initSmoke() {
    const noop = () => {};
    const canvas = document.getElementById('smoke');
    if (!canvas || this.reduce) return noop;
    const gl = canvas.getContext('webgl', { alpha: true, premultipliedAlpha: true });
    if (!gl) { canvas.style.display = 'none'; return noop; }
    const vs = 'attribute vec2 a_pos; void main(){ gl_Position = vec4(a_pos,0.0,1.0); }';
    const fs = [
      'precision mediump float;',
      'uniform vec2 u_resolution; uniform float u_time; uniform float u_boundary; uniform float u_intensity;',
      'float random(vec2 st){ return fract(sin(dot(st, vec2(12.9898,78.233)))*43758.5453123); }',
      'float noise(vec2 st){ vec2 i=floor(st); vec2 f=fract(st);',
      '  float a=random(i), b=random(i+vec2(1.0,0.0)), c=random(i+vec2(0.0,1.0)), d=random(i+vec2(1.0,1.0));',
      '  vec2 u=f*f*(3.0-2.0*f); return mix(a,b,u.x) + (c-a)*u.y*(1.0-u.x) + (d-b)*u.x*u.y; }',
      'float fbm(vec2 st){ float v=0.0, amp=0.5; for(int i=0;i<5;i++){ v+=amp*noise(st); st*=2.0; amp*=0.5; } return v; }',
      'void main(){',
      '  vec2 st = gl_FragCoord.xy / u_resolution.xy;',
      '  vec2 p = st * vec2(u_resolution.x/u_resolution.y, 1.0) * 3.2;',
      '  vec2 q = vec2(fbm(p + u_time*0.15), fbm(p + vec2(4.3,1.7) + u_time*0.12));',
      '  float f = fbm(p + q*1.6 + u_time*0.08);',
      '  float dist = abs((1.0 - st.y) - u_boundary);',
      '  float band = 1.0 - smoothstep(0.0, 0.75, dist);',
      '  float a = clamp(f*1.5, 0.0, 1.0) * band * u_intensity * 0.95;',
      '  gl_FragColor = vec4(a, a*0.93, a*0.96, a);',
      '}'
    ].join('\n');
    const compile = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); return s; };
    const prog = gl.createProgram();
    gl.attachShader(prog, compile(gl.VERTEX_SHADER, vs)); gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, fs));
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) { canvas.style.display = 'none'; return noop; }
    gl.useProgram(prog);
    const buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const aPos = gl.getAttribLocation(prog, 'a_pos'); gl.enableVertexAttribArray(aPos); gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);
    gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    const uRes = gl.getUniformLocation(prog, 'u_resolution'), uTime = gl.getUniformLocation(prog, 'u_time'), uB = gl.getUniformLocation(prog, 'u_boundary'), uI = gl.getUniformLocation(prog, 'u_intensity');
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    this.resizeSmoke = () => { const r = canvas.getBoundingClientRect(); canvas.width = Math.max(1, Math.round(r.width * dpr)); canvas.height = Math.max(1, Math.round(r.height * dpr)); gl.viewport(0, 0, canvas.width, canvas.height); };
    this.resizeSmoke();
    let smooth = 1, inited = false, cleared = false;
    return (p, t) => {
      const target = 1 - p;
      if (!inited) { smooth = target; inited = true; } else smooth += (target - smooth) * 0.12;
      const settle = 4 * smooth * (1 - smooth);
      if (settle < 0.01) { if (!cleared) { gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT); cleared = true; } return; }
      cleared = false;
      gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);
      gl.uniform2f(uRes, canvas.width, canvas.height); gl.uniform1f(uTime, t); gl.uniform1f(uB, smooth); gl.uniform1f(uI, settle);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    };
  }

  showToast(msg) {
    this.setState({ toastOn: true, toastMsg: msg || '클립보드에 복사되었습니다.' });
    clearTimeout(this.toastT); this.toastT = setTimeout(() => this.setState({ toastOn: false }), 2200);
  }
  copyUrl(msg) {
    const url = window.location.href;
    const fb = () => { const ta = document.createElement('textarea'); ta.value = url; ta.style.position = 'fixed'; ta.style.opacity = '0'; document.body.appendChild(ta); ta.select(); let ok = false; try { ok = document.execCommand('copy'); } catch (e) {} document.body.removeChild(ta); return ok; };
    if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(url).then(() => this.showToast(msg)).catch(() => { if (fb()) this.showToast(msg); });
    else if (fb()) this.showToast(msg);
  }
  popup(url) { const w = 600, h = 600; window.open(url, '_blank', 'width=' + w + ',height=' + h + ',left=' + (screen.width - w) / 2 + ',top=' + (screen.height - h) / 2 + ',noopener'); }
  openShare = () => { this.setState({ shareOpen: true }); document.body.style.overflow = 'hidden'; };
  closeShare = () => { this.setState({ shareOpen: false }); document.body.style.overflow = ''; };
  after(fn) { return () => { fn(); this.closeShare(); }; }

  renderVals() {
    const u = () => encodeURIComponent(window.location.href), ti = () => encodeURIComponent(this.SHARE_CONFIG.title);
    return {
      steps: [
        { n: '01', title: '피카 PC방 좌석에서 피카플레이 회원으로 로그인' },
        { n: '02', title: '일일 / 누적 플레이 미션 달성' },
        { n: '03', title: '피카플레이 APP 또는 크래프트박스 마이페이지에서 마일리지/쿠폰 보상 확인' }
      ],
      showWidget: this.props.showWidget ?? true,
      toolsOn: false,
      showPcWidget: false && !(this.mq && this.isMobile),
      onMoBgClick: () => { if ((this.props.showWidget ?? true) && this.isMobile) { const f = document.getElementById('kvMoFile'); if (f) f.click(); } },
      onMoBgPick: e => {
        const f = e.target.files && e.target.files[0]; if (!f) return;
        const prev = (this.state.overrides || {}).bgMo; if (prev) URL.revokeObjectURL(prev.url);
        const url = URL.createObjectURL(f);
        this.applyLayerSrc('bgMo', url);
        this.idb('readwrite', st => st.put({ blob: f, name: f.name }, 'bgMo')).then(() => this.showToast('모바일 KV 이미지가 변경·저장되었습니다.')).catch(() => this.showToast('이미지 저장 실패'));
        this.setState(st => ({ overrides: Object.assign({}, st.overrides, { bgMo: { url, name: f.name } }) }));
        e.target.value = '';
      },
      showMViewBtn: !/[?&]mview=1/.test(window.location.search),
      mViewOpen: this.state.mViewOpen,
      pcViewOpen: this.state.pcViewOpen,
      ...(() => {
        const sizes = [[1920, 1080], [1440, 900], [1280, 720]];
        const [w, h] = sizes[this.state.pcViewIdx || 0];
        const k = Math.min((window.innerWidth - 60) / w, (window.innerHeight - 120) / h, 1);
        return { pcW: w + 'px', pcH: h + 'px', pcScale: 'scale(' + k.toFixed(4) + ')', pcBoxW: Math.round(w * k) + 'px', pcBoxH: Math.round(h * k) + 'px',
          pcViewSizes: sizes.map(([sw, sh], i) => ({ label: sw + ' × ' + sh, color: (this.state.pcViewIdx || 0) === i ? '#fff' : '#ddd', bg: (this.state.pcViewIdx || 0) === i ? '#3a6df0' : 'transparent', onPick: () => this.setState({ pcViewIdx: i }) })) };
      })(),
      openPcView: () => { this.setState({ pcViewOpen: true, mViewOpen: false, widgetOpen: false, mWidgetOpen: false }); document.body.style.overflow = 'hidden'; },
      closePcView: () => { this.setState({ pcViewOpen: false }); document.body.style.overflow = ''; },
      onPcViewBackdrop: e => { if (e.target === e.currentTarget) { this.setState({ pcViewOpen: false }); document.body.style.overflow = ''; } },
      mViewSrc: window.location.pathname + '?mview=1',
      mViewW: [390, 360, 430, 350][this.state.mViewIdx] + 'px',
      mViewH: [844, 780, 932, 760][this.state.mViewIdx] + 'px',
      mViewSizes: [['390 × 844', 0], ['360 × 780', 1], ['430 × 932', 2], ['350 × 760', 3]].map(([label, i]) => ({ label, color: this.state.mViewIdx === i ? '#241a24' : '#fff', bg: this.state.mViewIdx === i ? '#ffd84a' : 'transparent', onPick: () => this.setState({ mViewIdx: i }) })),
      openMView: () => { this.setState({ mViewOpen: true, widgetOpen: false }); document.body.style.overflow = 'hidden'; },
      closeMView: () => { this.setState({ mViewOpen: false }); document.body.style.overflow = ''; this.restoreWidget(); },
      onMViewBackdrop: e => { if (e.target === e.currentTarget) { this.setState({ mViewOpen: false }); document.body.style.overflow = ''; this.restoreWidget(); } },
      widgetOpen: this.state.widgetOpen,
      widgetArrow: this.state.widgetOpen ? '▲' : '▼',
      toggleWidget: () => this.setState(s => ({ widgetOpen: !s.widgetOpen, mWidgetOpen: false })),
      resetLayers: this.resetLayers,
      saveWidget: this.saveWidget,
      layerRows: this.LAYERS.map(([k, label, src]) => {
        const o = this.state.overrides[k];
        return { label, src: o ? o.url : src, status: o ? '교체됨 · ' + o.name : src.split('/').pop(), statusColor: o ? '#ff9ccd' : '#8a7a85', onPick: e => this.pickLayer(k, e),
          hideLabel: (this.state.hidden || {})[k] ? '보이기' : '숨기기', hideColor: (this.state.hidden || {})[k] ? '#241a24' : '#d9c8d3', hideBg: (this.state.hidden || {})[k] ? '#ffd84a' : 'transparent', onToggle: () => this.toggleLayer(k, false),
          x: ((this.state.pos || {})[k] || {}).x || 0, y: ((this.state.pos || {})[k] || {}).y || 0,
          xLabel: (((this.state.pos || {})[k] || {}).x || 0).toFixed(1), yLabel: (((this.state.pos || {})[k] || {}).y || 0).toFixed(1),
          onX: e => this.moveLayer(k, 'x', parseFloat(e.target.value), false), onY: e => this.moveLayer(k, 'y', parseFloat(e.target.value), false),
          sc: ((this.state.pos || {})[k] || {}).s || 100, sLabel: (((this.state.pos || {})[k] || {}).s || 100) + '%',
          onS: e => this.moveLayer(k, 's', parseFloat(e.target.value), false),
          onResetPos: () => this.resetPosOf(k, false) };
      }),
      mWidgetOpen: this.state.mWidgetOpen,
      mWidgetArrow: this.state.mWidgetOpen ? '▲' : '▼',
      toggleMWidget: () => this.setState(s => ({ mWidgetOpen: !s.mWidgetOpen, widgetOpen: false })),
      resetMobile: this.resetMobile,
      mNote: this.mq && this.isMobile ? '모바일 화면입니다. 여기서 바꾼 값이 바로 적용돼요.' : 'PC 화면에서는 값만 저장되고 화면엔 안 보여요. 모바일 미리보기(1024px 이하)에서 확인하세요.',
      mNoteColor: this.mq && this.isMobile ? '#6fe3e8' : '#ffb35c',
      mLayerRows: this.LAYERS.filter(([k]) => k.indexOf('item-') !== 0).map(([k, label, src]) => {
        const o = this.state.overrides[k], p = (this.state.posM || {})[k] || {}, h = (this.state.hiddenM || {})[k];
        return { label, src: o ? o.url : src,
          hideLabel: h ? '보이기' : '숨기기', hideColor: h ? '#241a24' : '#d9c8d3', hideBg: h ? '#ffd84a' : 'transparent', onToggle: () => this.toggleLayer(k, true),
          x: p.x || 0, y: p.y || 0, sc: p.s || 100,
          xLabel: (p.x || 0).toFixed(1), yLabel: (p.y || 0).toFixed(1), sLabel: (p.s || 100) + '%',
          onX: e => this.moveLayer(k, 'x', parseFloat(e.target.value), true), onY: e => this.moveLayer(k, 'y', parseFloat(e.target.value), true),
          onS: e => this.moveLayer(k, 's', parseFloat(e.target.value), true),
          onResetPos: () => this.resetPosOf(k, true) };
      }),
      shareDisplay: this.state.shareOpen ? 'flex' : 'none',
      toastOpacity: this.state.toastOn ? 1 : 0,
      toastTransform: this.state.toastOn ? 'translate(-50%,0)' : 'translate(-50%,12px)',
      toastMsg: this.state.toastMsg,
      openShare: this.openShare,
      closeShare: this.closeShare,
      onModalBackdrop: e => { if (e.target === e.currentTarget) this.closeShare(); },
      shareFacebook: this.after(() => this.popup('https://www.facebook.com/sharer/sharer.php?u=' + u())),
      shareTwitter: this.after(() => this.popup('https://twitter.com/intent/tweet?url=' + u() + '&text=' + ti())),
      shareNaver: this.after(() => this.popup('https://share.naver.com/web/shareView?url=' + u() + '&title=' + ti())),
      shareKakao: this.after(() => {
        if (!window.Kakao || !Kakao.Share || !Kakao.isInitialized()) return;
        const href = window.location.href, c = this.SHARE_CONFIG;
        try { Kakao.Share.sendDefault({ objectType: 'feed', content: { title: c.title, description: c.description, imageUrl: c.ogImage, link: { mobileWebUrl: href, webUrl: href } }, buttons: [{ title: '자세히 보기', link: { mobileWebUrl: href, webUrl: href } }] }); } catch (e) {}
      }),
      shareInstagram: this.after(() => this.copyUrl('URL이 복사되었습니다. 인스타그램에 붙여넣어 주세요.')),
      shareCopy: this.after(() => this.copyUrl('클립보드에 복사되었습니다.')),
      scrollTop: () => { try { window.scrollTo({ top: 0, behavior: this.reduce ? 'auto' : 'smooth' }); } catch (e) { document.documentElement.scrollTop = 0; } }
    };
  }
}

  // 저장소 대신 고정 배치값 적용
  Component.prototype.restoreWidget = function () { this.setState(JSON.parse(JSON.stringify(LAYOUT)), () => this.applyAll()); };
  Component.prototype.saveLS = function () {};

  function start() { var app = new Component(); app._render(); app._bind(); app.componentDidMount(); window.__app = app; }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
