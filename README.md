# 배그 X PICA PC방 BOOST WEEKEND 이벤트 페이지

## 폴더 구조
```
export/
├─ index.html            페이지 마크업
└─ assets/
   ├─ css/style.css      기본 스타일 · 키프레임 · 호버(.hvN)
   ├─ js/main.js         KV 패럴랙스/안개/불꽃/스크롤 연출 · 반응형 · 공유 모달
   ├─ js/sakura.js       MISSION 01 벚꽃
   └─ images/            모든 이미지 (webp/svg), kv/ 는 KV 레이어
```

## 메모
- 로컬에서 볼 때는 VS Code Live Server 등으로 열기 (file:// 로 열면 일부 기능 제한)
- 레이아웃 기준: 768px 이하 모바일, 1024px 이하 태블릿
- KV 레이어 위치 미세조정값은 `assets/js/main.js` 상단 `LAYOUT` (pos=PC, posM=모바일, hidden/hiddenM=숨김)
- 카카오 공유: `main.js` 의 `SHARE_CONFIG.kakaoKey` 에 JavaScript 키 입력
- OG 메타: `index.html` head 의 `[[HTTPS_PAGE_URL]]`, `[[HTTPS_ABSOLUTE_IMAGE_URL]]` 교체
