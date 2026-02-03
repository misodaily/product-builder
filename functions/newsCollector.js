/**
 * 실제 뉴스 수집 로직 구현
 * RSS 피드 파싱 및 카테고리별 뉴스 분류
 */

const axios = require('axios');
const cheerio = require('cheerio');

/**
 * RSS 피드를 파싱하여 뉴스 아이템 추출
 */
async function parseRSSFeed(url) {
  try {
    const response = await axios.get(url, {
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; miso_daily/1.0)'
      }
    });

    const $ = cheerio.load(response.data, { xmlMode: true });
    const items = [];

    $('item').each((index, element) => {
      const title = $(element).find('title').text().trim();
      const description = $(element).find('description').text().trim();
      const link = $(element).find('link').text().trim();
      const pubDate = $(element).find('pubDate').text().trim();

      if (title && description) {
        items.push({
          title,
          summary: cleanText(description),
          url: link,
          timeISO: pubDate ? new Date(pubDate).toISOString() : new Date().toISOString()
        });
      }
    });

    return items;
  } catch (error) {
    console.error(`Error parsing RSS feed ${url}:`, error.message);
    return [];
  }
}

/**
 * HTML 태그 제거 및 텍스트 정리
 */
function cleanText(text) {
  return text
    .replace(/<[^>]*>/g, '') // HTML 태그 제거
    .replace(/&nbsp;/g, ' ')
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 120); // 120자로 제한
}

/**
 * 카테고리별 뉴스 소스 매핑
 */
const CATEGORY_SOURCES = {
  semiconductor: {
    tag: 'semiconductor',
    sources: [
      { url: 'https://www.etnews.com/rss/S1N1.xml', name: '전자신문' },
      { url: 'https://www.thebell.co.kr/free/rss/articles.asp?sid=semiconductor', name: '더벨' }
    ],
    keywords: ['반도체', '삼성전자', 'SK하이닉스', 'HBM', 'DRAM', 'NAND', '파운드리']
  },
  ai: {
    tag: 'ai',
    sources: [
      { url: 'https://www.aitimes.com/rss/allArticle.xml', name: 'AI타임스' },
      { url: 'https://www.etnews.com/rss/S1N12.xml', name: '전자신문' }
    ],
    keywords: ['AI', '인공지능', '생성AI', '챗GPT', '딥러닝', '머신러닝']
  },
  bio: {
    tag: 'bio',
    sources: [
      { url: 'https://www.thebionews.net/rss/allArticle.xml', name: '더바이오뉴스' },
      { url: 'https://www.pharmnews.com/rss/allArticle.xml', name: '팜뉴스' }
    ],
    keywords: ['바이오', '제약', '셀트리온', '삼성바이오', 'CDMO']
  },
  auto: {
    tag: 'auto',
    sources: [
      { url: 'https://www.autoherald.co.kr/rss/allArticle.xml', name: '오토헤럴드' }
    ],
    keywords: ['전기차', '현대차', '기아', 'EV', '자동차']
  },
  aerospace: {
    tag: 'aerospace',
    sources: [
      { url: 'https://www.newsspace.kr/rss/allArticle.xml', name: '뉴스스페이스' }
    ],
    keywords: ['방산', '우주', '항공', '한화', 'HD현대', '잠수함']
  },
  finance: {
    tag: 'finance',
    sources: [
      { url: 'https://www.fnnews.com/rss/finance.xml', name: '파이낸셜뉴스' }
    ],
    keywords: ['은행', '금융', 'KB', '신한', '하나', '금리']
  },
  robot: {
    tag: 'robot',
    sources: [
      { url: 'https://www.irobotnews.com/rss/allArticle.xml', name: '로봇신문' }
    ],
    keywords: ['로봇', '휴머노이드', 'AI로봇', '현대로보틱스']
  },
  steel: {
    tag: 'steel',
    sources: [
      { url: 'http://www.snmnews.com/rss/allArticle.xml', name: '철강금속신문' }
    ],
    keywords: ['철강', '포스코', '현대제철', '탄소중립']
  },
  chemical: {
    tag: 'chemical',
    sources: [
      { url: 'https://www.chemie.or.kr/rss/allArticle.xml', name: '화학신문' }
    ],
    keywords: ['화학', 'LG화학', '롯데케미칼', '석유화학']
  },
  macro: {
    tag: 'macro',
    sources: [
      { url: 'https://www.hankyung.com/feed/economy', name: '한국경제' }
    ],
    keywords: ['금리', '한국은행', '거시경제', 'GDP', '물가']
  },
  earnings: {
    tag: 'earnings',
    sources: [
      { url: 'https://www.sedaily.com/RSS/Feed/S12.xml', name: '서울경제' }
    ],
    keywords: ['실적', '영업이익', '매출', '분기']
  },
  energy: {
    tag: 'energy',
    sources: [
      { url: 'https://www.energy-news.co.kr/rss/allArticle.xml', name: '에너지신문' }
    ],
    keywords: ['에너지', 'LNG', '유가', '재생에너지', 'SK에너지', 'GS칼텍스']
  }
};

/**
 * 뉴스가 특정 카테고리와 관련있는지 키워드로 판별
 */
function matchesCategory(title, description, keywords) {
  const text = `${title} ${description}`.toLowerCase();
  return keywords.some(keyword => text.includes(keyword.toLowerCase()));
}

/**
 * 모든 카테고리의 뉴스 수집
 */
async function collectAllNews() {
  const allHeadlines = [];

  for (const [categoryKey, config] of Object.entries(CATEGORY_SOURCES)) {
    console.log(`Collecting news for category: ${categoryKey}`);

    for (const source of config.sources) {
      try {
        const items = await parseRSSFeed(source.url);

        // 카테고리별 키워드로 필터링
        const filtered = items
          .filter(item => matchesCategory(item.title, item.summary, config.keywords))
          .slice(0, 5) // 카테고리당 최대 5개
          .map(item => ({
            ...item,
            tag: config.tag,
            source: source.name
          }));

        allHeadlines.push(...filtered);
        console.log(`Found ${filtered.length} articles for ${categoryKey} from ${source.name}`);

      } catch (error) {
        console.error(`Error collecting from ${source.name}:`, error.message);
      }
    }
  }

  // 시간순 정렬
  allHeadlines.sort((a, b) => new Date(b.timeISO) - new Date(a.timeISO));

  return allHeadlines;
}

module.exports = {
  collectAllNews,
  parseRSSFeed,
  CATEGORY_SOURCES
};
