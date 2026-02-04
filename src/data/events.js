// src/data/events.js
export const EVENT_LABELS = {
  earnings: '실적',
  guidance: '가이던스',
  contract: '수주',
  regulation: '규제',
  lawsuit: '소송',
  recall: '리콜/사고',
  macro: '매크로',
  other: '기타',
};

// 샘플 이벤트 데이터
const now = new Date();
const h = (hours) => new Date(now.getTime() - hours * 60 * 60 * 1000).toISOString();

export const SAMPLE_EVENTS = [
  {
    id: 'kr-005930-2026-02-04-hbm-capacity',
    market: 'kr', ticker: '005930',
    startedAt: h(2), updatedAt: h(1),
    type: 'guidance',
    summary2: ['삼성전자, 2026년 HBM 생산능력 40% 확대 계획 발표.', '엔비디아向 HBM3E 공급 계약 체결 임박 소식.'],
    why: 'AI 반도체 수요 급증 속 메모리 업황 회복 신호로 해석.',
    links: [
      { source: '한국경제', url: 'https://example.com/1', title: '삼성전자, HBM 생산능력 40% 확대', publishedAt: h(2) },
      { source: '조선비즈', url: 'https://example.com/2', title: '삼성-엔비디아 HBM3E 공급 협상 막바지', publishedAt: h(3) },
    ],
    confidence: 'reported', // Added confidence field
  },
  {
    id: 'kr-005930-2026-02-03-q4-earnings',
    market: 'kr', ticker: '005930',
    startedAt: h(26), updatedAt: h(24),
    type: 'earnings',
    summary2: ['삼성전자 2025년 4분기 영업이익 12.3조원, 전년比 +45%.', 'HBM·AI 서버 DRAM 호조로 DS부문 흑자 전환 확정.'],
    why: '메모리 슈퍼사이클 진입 신호, 업종 전체 re-rating 기대.',
    links: [
      { source: '연합뉴스', url: 'https://example.com/3', title: '삼성전자 4분기 영업익 12.3조', publishedAt: h(26) },
      { source: '매일경제', url: 'https://example.com/4', title: '삼성전자 DS부문 2분기 연속 흑자', publishedAt: h(27) },
    ],
    confidence: 'confirmed', // Example: marking as confirmed
  },
  {
    id: 'kr-000660-2026-02-04-nvidia-deal',
    market: 'kr', ticker: '000660',
    startedAt: h(4), updatedAt: h(2),
    type: 'contract',
    summary2: ['SK하이닉스, 엔비디아와 2026년 HBM3E 독점 공급 계약 체결.', '계약 규모 약 15조원, 연간 공급량 전년 대비 2배 증가.'],
    why: 'AI GPU 시장 지배력 강화, 영업이익률 60% 돌파 전망.',
    links: [
      { source: '블룸버그', url: 'https://example.com/5', title: 'SK Hynix Secures $12B NVIDIA HBM Deal', publishedAt: h(4) },
      { source: '서울경제', url: 'https://example.com/6', title: 'SK하이닉스-엔비디아 15조 계약', publishedAt: h(5) },
    ],
    confidence: 'reported',
  },
  {
    id: 'us-TSLA-2026-02-04-recall',
    market: 'us', ticker: 'TSLA',
    startedAt: h(6), updatedAt: h(3),
    type: 'recall',
    summary2: ['테슬라, 사이버트럭 12만대 자발적 리콜 발표.', '스티어링 시스템 소프트웨어 결함, OTA 업데이트로 해결 예정.'],
    why: '리콜 규모 대비 주가 영향 제한적 전망, SW 업데이트로 해결 가능.',
    links: [
      { source: 'Reuters', url: 'https://example.com/7', title: 'Tesla Recalls 120,000 Cybertrucks', publishedAt: h(6) },
      { source: 'CNBC', url: 'https://example.com/8', title: 'Tesla Cybertruck Recall: What You Need to Know', publishedAt: h(7) },
    ],
    confidence: 'confirmed',
  },
  {
    id: 'us-TSLA-2026-02-03-q4-delivery',
    market: 'us', ticker: 'TSLA',
    startedAt: h(30), updatedAt: h(28),
    type: 'earnings',
    summary2: ['테슬라 4분기 인도량 51만대, 시장 예상 48만대 상회.', '연간 인도량 195만대로 역대 최고 기록 경신.'],
    why: '수요 둔화 우려 해소, 2026년 가이던스 상향 가능성.',
    links: [
      { source: 'Bloomberg', url: 'https://example.com/9', title: 'Tesla Q4 Deliveries Beat Estimates', publishedAt: h(30) },
    ],
    confidence: 'confirmed',
  },
  {
    id: 'us-NVDA-2026-02-04-blackwell',
    market: 'us', ticker: 'NVDA',
    startedAt: h(8), updatedAt: h(5),
    type: 'guidance',
    summary2: ['엔비디아, 블랙웰 GPU 2분기 대량 양산 돌입 확인.', 'MS·아마존·구글 등 빅테크 주문량 전분기 대비 3배 증가.'],
    why: 'AI 인프라 투자 가속화 수혜, 연간 매출 1,500억 달러 전망.',
    links: [
      { source: 'CNBC', url: 'https://example.com/10', title: 'NVIDIA Blackwell Mass Production Begins', publishedAt: h(8) },
      { source: 'WSJ', url: 'https://example.com/11', title: 'Big Tech Races to Secure NVIDIA GPUs', publishedAt: h(10) },
    ],
    confidence: 'reported',
  },
  {
    id: 'us-AAPL-2026-02-03-ai-iphone',
    market: 'us', ticker: 'AAPL',
    startedAt: h(36), updatedAt: h(32),
    type: 'guidance',
    summary2: ['애플, 아이폰17 프로에 자체 AI 칩 탑재 확정.', '온디바이스 AI 성능 40% 향상, 클라우드 의존도 대폭 감소.'],
    why: '삼성·구글 대비 AI 경쟁력 강화, 프리미엄 시장 지배력 확대.',
    links: [
      { source: 'Apple Insider', url: 'https://example.com/12', title: 'iPhone 17 Pro to Feature Apple AI Chip', publishedAt: h(36) },
    ],
    confidence: 'speculative', // Example: marking as speculative
  },
  {
    id: 'kr-005380-2026-02-04-us-ev',
    market: 'kr', ticker: '005380',
    startedAt: h(5), updatedAt: h(3),
    type: 'contract',
    summary2: ['현대차, 미국 조지아 공장 EV 생산량 연 40만대로 확대.', 'IRA 보조금 적용 차종 확대, 연간 2.5조원 세액공제 혜택.'],
    why: '미국 EV 시장 점유율 확대 가속, 2위 도약 가시화.',
    links: [
      { source: '한국경제', url: 'https://example.com/13', title: '현대차 조지아공장 증설 확정', publishedAt: h(5) },
    ],
    confidence: 'confirmed',
  },
  {
    id: 'kr-035420-2026-02-04-ai-search',
    market: 'kr', ticker: '035420',
    startedAt: h(3), updatedAt: h(1),
    type: 'other',
    summary2: ['네이버, AI 검색 큐(Cue:) 월간 사용자 2,000만 돌파.', '기존 검색 대비 체류시간 35% 증가, 광고 수익성 개선 기대.'],
    why: '생성AI 검색 경쟁에서 국내 시장 선점 효과 가시화.',
    links: [
      { source: '조선비즈', url: 'https://example.com/14', title: '네이버 AI 검색 큐: 2천만 사용자 돌파', publishedAt: h(3) },
    ],
    confidence: 'reported',
  },
  {
    id: 'us-META-2026-02-03-threads',
    market: 'us', ticker: 'META',
    startedAt: h(28), updatedAt: h(26),
    type: 'earnings',
    summary2: ['메타, 쓰레드 MAU 5억 돌파로 트위터(X) 추월.', '광고 수익화 본격 시작, 2026년 매출 기여 50억 달러 전망.'],
    why: '소셜미디어 경쟁 구도 재편, 신규 성장동력 확보.',
    links: [
      { source: 'TechCrunch', url: 'https://example.com/15', title: 'Threads Hits 500M Users', publishedAt: h(28) },
    ],
    confidence: 'reported',
  },
  {
    id: 'kr-105560-2026-02-04-dividend',
    market: 'kr', ticker: '105560',
    startedAt: h(4), updatedAt: h(2),
    type: 'earnings',
    summary2: ['KB금융, 2025년 배당금 4,800원 확정, 전년比 +20%.', '주주환원율 53% 달성, 금융지주 중 최고 수준.'],
    why: '밸류업 프로그램 모범 사례, PBR 1배 돌파 기대.',
    links: [
      { source: '매일경제', url: 'https://example.com/16', title: 'KB금융 배당금 4,800원 확정', publishedAt: h(4) },
    ],
    confidence: 'confirmed',
  },
  {
    id: 'us-JPM-2026-02-03-rate-outlook',
    market: 'us', ticker: 'JPM',
    startedAt: h(32), updatedAt: h(30),
    type: 'macro',
    summary2: ['JP모건, 2026년 연준 금리 인하 3회 전망 유지.', '상반기 동결 후 하반기 75bp 인하 예상.'],
    why: '글로벌 금리 방향성 판단 참고, 금융주 투자 심리 영향.',
    links: [
      { source: 'Bloomberg', url: 'https://example.com/17', title: 'JPMorgan Sees 3 Fed Rate Cuts in 2026', publishedAt: h(32) },
    ],
    confidence: 'speculative',
  },
  {
    id: 'kr-068270-2026-02-04-fda',
    market: 'kr', ticker: '068270',
    startedAt: h(6), updatedAt: h(4),
    type: 'regulation',
    summary2: ['셀트리온, FDA 바이오시밀러 신약 승인 획득.', '미국 시장 진출 확대, 연간 매출 1.5조원 추가 기대.'],
    why: '글로벌 바이오시밀러 시장 점유율 확대 가속.',
    links: [
      { source: '뉴스1', url: 'https://example.com/18', title: '셀트리온 FDA 승인 획득', publishedAt: h(6) },
    ],
    confidence: 'confirmed',
  },
  {
    id: 'us-GOOGL-2026-02-04-antitrust',
    market: 'us', ticker: 'GOOGL',
    startedAt: h(10), updatedAt: h(8),
    type: 'lawsuit',
    summary2: ['구글, 미국 법무부 반독점 소송 1심 패소.', '검색엔진 시장 지배력 남용 인정, 구제책 협의 예정.'],
    why: '사업 분할 가능성 대두, 규제 리스크 장기화 전망.',
    links: [
      { source: 'Reuters', url: 'https://example.com/19', title: 'Google Loses Antitrust Case', publishedAt: h(10) },
    ],
    confidence: 'confirmed',
  },
];