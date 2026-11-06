// 티저 KV 등장 애니메이션: 로고 → START 배지 → 타이틀 → 정보 박스 → 하단 문구 순서로 하나씩 등장
(function () {
  // PC: 로고 줄을 타이틀 묶음(세로 가운데 정렬) 밖 KV로 옮겨 index와 같은 좌표에 고정 / 모바일: 원래 자리(타이틀 위)로
  var row = document.getElementById('kvBrandRow'), kv = document.getElementById('kv');
  if (row && kv) {
    var home = row.parentNode, next = row.nextSibling, pc = matchMedia('(min-width: 1025px)');
    var place = function () { if (pc.matches) { if (row.parentNode !== kv) kv.appendChild(row); } else if (row.parentNode !== home) home.insertBefore(row, next); };
    place(); pc.addEventListener('change', place);
  }
  var reveal = function () { document.body.classList.remove('t-anim'); };
  if (!window.jQuery || matchMedia('(prefers-reduced-motion: reduce)').matches) { reveal(); return; }
  var STEP = [150, 450, 750, 1150, 1450]; // data-t-in 단계별 시작 시점(ms)
  jQuery(function ($) {
    $('[data-t-in]').each(function () {
      var $el = $(this);
      setTimeout(function () { $el.addClass('t-in'); }, STEP[+$el.data('t-in')] || 0);
    });
  });
})();
