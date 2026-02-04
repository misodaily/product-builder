/**
 * 뉴스 기사 클러스터링 및 중복 제거 유틸리티
 * MVP 수준 구현 - 추후 ML 기반 고도화 가능
 */

/**
 * 텍스트를 토큰으로 분리 (간단한 whitespace + 한글/영문 토크나이저)
 */
export function tokenize(text) {
  if (!text) return [];
  // 특수문자 제거, 소문자 변환
  const cleaned = text.toLowerCase()
    .replace(/[^\w\s가-힣]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return cleaned.split(' ').filter(t => t.length > 1);
}

/**
 * 자카드 유사도 계산
 */
export function jaccardSimilarity(tokens1, tokens2) {
  if (!tokens1.length || !tokens2.length) return 0;

  const set1 = new Set(tokens1);
  const set2 = new Set(tokens2);

  let intersection = 0;
  for (const t of set1) {
    if (set2.has(t)) intersection++;
  }

  const union = set1.size + set2.size - intersection;
  return union > 0 ? intersection / union : 0;
}

/**
 * 두 기사의 유사도 계산
 */
export function articleSimilarity(a1, a2) {
  const tokens1 = tokenize(a1.title + ' ' + (a1.snippet || ''));
  const tokens2 = tokenize(a2.title + ' ' + (a2.snippet || ''));
  return jaccardSimilarity(tokens1, tokens2);
}

/**
 * 시간 차이 계산 (시간 단위)
 */
export function hoursDiff(iso1, iso2) {
  const d1 = new Date(iso1);
  const d2 = new Date(iso2);
  return Math.abs(d1 - d2) / (1000 * 60 * 60);
}

/**
 * 기사를 사건 단위로 클러스터링
 * @param {Article[]} articles - 기사 목록
 * @param {Object} options - 옵션
 * @returns {Article[][]} - 클러스터 배열
 */
export function clusterArticles(articles, options = {}) {
  const {
    timeWindowHours = 12,      // 같은 사건으로 볼 시간 범위 (±12시간)
    similarityThreshold = 0.3, // 유사도 임계값
  } = options;

  if (!articles.length) return [];

  // 시간순 정렬
  const sorted = [...articles].sort(
    (a, b) => new Date(a.publishedAt) - new Date(b.publishedAt)
  );

  const clusters = [];
  const assigned = new Set();

  for (let i = 0; i < sorted.length; i++) {
    if (assigned.has(i)) continue;

    const cluster = [sorted[i]];
    assigned.add(i);

    for (let j = i + 1; j < sorted.length; j++) {
      if (assigned.has(j)) continue;

      // 시간 차이 체크
      const hDiff = hoursDiff(sorted[i].publishedAt, sorted[j].publishedAt);
      if (hDiff > timeWindowHours) continue;

      // 유사도 체크
      const sim = articleSimilarity(sorted[i], sorted[j]);
      if (sim >= similarityThreshold) {
        cluster.push(sorted[j]);
        assigned.add(j);
      }
    }

    clusters.push(cluster);
  }

  return clusters;
}

/**
 * URL 기반 중복 제거
 */
export function dedupeByUrl(articles) {
  const seen = new Set();
  return articles.filter(a => {
    if (!a.url) return true;
    const normalized = a.url.toLowerCase().replace(/\/$/, '');
    if (seen.has(normalized)) return false;
    seen.add(normalized);
    return true;
  });
}

/**
 * 제목 유사도 기반 중복 제거 (대표 기사만 남기고 나머지는 추가 링크로)
 */
export function dedupeByTitle(articles, threshold = 0.6) {
  if (articles.length <= 1) return { primary: articles, additional: [] };

  const sorted = [...articles].sort(
    (a, b) => new Date(b.publishedAt) - new Date(a.publishedAt)
  );

  const primary = [sorted[0]];
  const additional = [];

  for (let i = 1; i < sorted.length; i++) {
    let isDupe = false;
    for (const p of primary) {
      if (articleSimilarity(sorted[i], p) >= threshold) {
        isDupe = true;
        break;
      }
    }
    if (isDupe) {
      additional.push(sorted[i]);
    } else {
      primary.push(sorted[i]);
    }
  }

  return { primary, additional };
}

/**
 * 사건 라벨 추론 (룰 기반)
 */
const LABEL_RULES = [
  {
    type: 'earnings',
    keywords: ['실적', '영업이익', '순이익', '매출', 'earnings', 'revenue', 'profit', 'quarterly', '분기', 'EPS']
  },
  {
    type: 'guidance',
    keywords: ['가이던스', '전망', 'guidance', 'outlook', 'forecast', '예상', '목표']
  },
  {
    type: 'contract',
    keywords: ['수주', '계약', 'contract', 'deal', 'order', '공급', 'supply']
  },
  {
    type: 'regulation',
    keywords: ['규제', 'regulation', 'regulator', 'FDA', 'SEC', '승인', 'approval', '인허가']
  },
  {
    type: 'lawsuit',
    keywords: ['소송', '재판', 'lawsuit', 'court', 'antitrust', '반독점', '벌금', 'fine']
  },
  {
    type: 'recall',
    keywords: ['리콜', '사고', 'recall', 'defect', '결함', 'incident', 'accident', '안전']
  },
  {
    type: 'macro',
    keywords: ['금리', '연준', 'Fed', 'interest rate', '인플레이션', 'inflation', 'CPI', 'GDP', '한은']
  },
];

export function inferEventLabel(text) {
  const lowerText = text.toLowerCase();

  for (const rule of LABEL_RULES) {
    for (const kw of rule.keywords) {
      if (lowerText.includes(kw.toLowerCase())) {
        return rule.type;
      }
    }
  }

  return 'other';
}

/**
 * 기사 클러스터를 Event 객체로 변환
 */
export function clusterToEvent(cluster, market, ticker) {
  if (!cluster.length) return null;

  // 가장 최신 기사 기준
  const sorted = [...cluster].sort(
    (a, b) => new Date(b.publishedAt) - new Date(a.publishedAt)
  );
  const latest = sorted[0];
  const oldest = sorted[sorted.length - 1];

  // 중복 제거
  const deduped = dedupeByUrl(sorted);
  const { primary, additional } = dedupeByTitle(deduped);

  // 모든 기사 제목/스니펫 합쳐서 라벨 추론
  const allText = cluster.map(a => a.title + ' ' + (a.snippet || '')).join(' ');
  const type = inferEventLabel(allText);

  // 날짜 기반 slug 생성
  const dateStr = new Date(latest.publishedAt).toISOString().split('T')[0];
  const slugBase = tokenize(latest.title).slice(0, 3).join('-') || 'event';
  const id = `${market}-${ticker}-${dateStr}-${slugBase}`;

  return {
    id,
    market,
    ticker,
    startedAt: oldest.publishedAt,
    updatedAt: latest.publishedAt,
    type,
    // MVP: 제목 기반 요약 (실제로는 LLM 사용 권장)
    summary2: [
      primary[0]?.title || '',
      primary[1]?.title || primary[0]?.snippet || ''
    ].filter(Boolean),
    why: `관련 기사 ${cluster.length}건 발생. 시장 관심도 높음.`,
    links: [...primary, ...additional.slice(0, 2)].map(a => ({
      source: a.source,
      url: a.url,
      title: a.title,
      publishedAt: a.publishedAt,
      snippet: a.snippet,
    })),
  };
}

/**
 * 전체 파이프라인: 기사 → 사건 목록
 */
export function articlesToEvents(articles, market, ticker, options = {}) {
  const clusters = clusterArticles(articles, options);
  return clusters
    .map(c => clusterToEvent(c, market, ticker))
    .filter(Boolean)
    .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
}

export default {
  tokenize,
  jaccardSimilarity,
  articleSimilarity,
  clusterArticles,
  dedupeByUrl,
  dedupeByTitle,
  inferEventLabel,
  clusterToEvent,
  articlesToEvents,
};
