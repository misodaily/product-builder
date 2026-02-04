/**
 * TOP50 종목 마스터 데이터
 * market: 'kr' | 'us'
 * ticker: 종목코드
 * exchange: 거래소 (optional)
 * name_ko: 한글 회사명
 * name_en: 영문 회사명
 * query_terms: 뉴스 검색 확장어
 * exclude_terms: 제외 키워드
 */

export const TOP50_KR = [
  { market: 'kr', ticker: '005930', exchange: 'KRX', name_ko: '삼성전자', name_en: 'Samsung Electronics', query_terms: ['삼성전자', '삼전', 'Samsung Electronics'], exclude_terms: [] },
  { market: 'kr', ticker: '000660', exchange: 'KRX', name_ko: 'SK하이닉스', name_en: 'SK Hynix', query_terms: ['SK하이닉스', '하이닉스', 'SK Hynix'], exclude_terms: [] },
  { market: 'kr', ticker: '373220', exchange: 'KRX', name_ko: 'LG에너지솔루션', name_en: 'LG Energy Solution', query_terms: ['LG에너지솔루션', 'LGES'], exclude_terms: [] },
  { market: 'kr', ticker: '207940', exchange: 'KRX', name_ko: '삼성바이오로직스', name_en: 'Samsung Biologics', query_terms: ['삼성바이오로직스', '삼성바이오'], exclude_terms: [] },
  { market: 'kr', ticker: '005935', exchange: 'KRX', name_ko: '삼성전자우', name_en: 'Samsung Electronics Pref', query_terms: ['삼성전자우'], exclude_terms: [] },
  { market: 'kr', ticker: '005380', exchange: 'KRX', name_ko: '현대차', name_en: 'Hyundai Motor', query_terms: ['현대차', '현대자동차', 'Hyundai Motor'], exclude_terms: [] },
  { market: 'kr', ticker: '068270', exchange: 'KRX', name_ko: '셀트리온', name_en: 'Celltrion', query_terms: ['셀트리온', 'Celltrion'], exclude_terms: [] },
  { market: 'kr', ticker: '000270', exchange: 'KRX', name_ko: '기아', name_en: 'Kia', query_terms: ['기아', '기아차', 'Kia'], exclude_terms: [] },
  { market: 'kr', ticker: '035420', exchange: 'KRX', name_ko: 'NAVER', name_en: 'NAVER', query_terms: ['네이버', 'NAVER'], exclude_terms: [] },
  { market: 'kr', ticker: '051910', exchange: 'KRX', name_ko: 'LG화학', name_en: 'LG Chem', query_terms: ['LG화학', 'LG Chem'], exclude_terms: [] },
  { market: 'kr', ticker: '006400', exchange: 'KRX', name_ko: '삼성SDI', name_en: 'Samsung SDI', query_terms: ['삼성SDI', 'Samsung SDI'], exclude_terms: [] },
  { market: 'kr', ticker: '035720', exchange: 'KRX', name_ko: '카카오', name_en: 'Kakao', query_terms: ['카카오', 'Kakao'], exclude_terms: ['카카오뱅크', '카카오페이'] },
  { market: 'kr', ticker: '028260', exchange: 'KRX', name_ko: '삼성물산', name_en: 'Samsung C&T', query_terms: ['삼성물산', 'Samsung C&T'], exclude_terms: [] },
  { market: 'kr', ticker: '105560', exchange: 'KRX', name_ko: 'KB금융', name_en: 'KB Financial', query_terms: ['KB금융', 'KB Financial', 'KB금융지주'], exclude_terms: [] },
  { market: 'kr', ticker: '055550', exchange: 'KRX', name_ko: '신한지주', name_en: 'Shinhan Financial', query_terms: ['신한지주', '신한금융', 'Shinhan'], exclude_terms: [] },
  { market: 'kr', ticker: '012330', exchange: 'KRX', name_ko: '현대모비스', name_en: 'Hyundai Mobis', query_terms: ['현대모비스', 'Hyundai Mobis'], exclude_terms: [] },
  { market: 'kr', ticker: '066570', exchange: 'KRX', name_ko: 'LG전자', name_en: 'LG Electronics', query_terms: ['LG전자', 'LG Electronics'], exclude_terms: [] },
  { market: 'kr', ticker: '003670', exchange: 'KRX', name_ko: '포스코홀딩스', name_en: 'POSCO Holdings', query_terms: ['포스코홀딩스', '포스코', 'POSCO'], exclude_terms: [] },
  { market: 'kr', ticker: '086790', exchange: 'KRX', name_ko: '하나금융지주', name_en: 'Hana Financial', query_terms: ['하나금융', 'Hana Financial'], exclude_terms: [] },
  { market: 'kr', ticker: '034730', exchange: 'KRX', name_ko: 'SK', name_en: 'SK Inc', query_terms: ['SK', 'SK Inc'], exclude_terms: ['SK하이닉스', 'SK텔레콤'] },
  { market: 'kr', ticker: '096770', exchange: 'KRX', name_ko: 'SK이노베이션', name_en: 'SK Innovation', query_terms: ['SK이노베이션', 'SK Innovation'], exclude_terms: [] },
  { market: 'kr', ticker: '032830', exchange: 'KRX', name_ko: '삼성생명', name_en: 'Samsung Life', query_terms: ['삼성생명', 'Samsung Life'], exclude_terms: [] },
  { market: 'kr', ticker: '003550', exchange: 'KRX', name_ko: 'LG', name_en: 'LG Corp', query_terms: ['LG', 'LG Corp'], exclude_terms: ['LG전자', 'LG화학', 'LG에너지'] },
  { market: 'kr', ticker: '017670', exchange: 'KRX', name_ko: 'SK텔레콤', name_en: 'SK Telecom', query_terms: ['SK텔레콤', 'SKT', 'SK Telecom'], exclude_terms: [] },
  { market: 'kr', ticker: '030200', exchange: 'KRX', name_ko: 'KT', name_en: 'KT Corp', query_terms: ['KT', 'KT Corp'], exclude_terms: ['KT&G'] },
];

export const TOP50_US = [
  { market: 'us', ticker: 'AAPL', exchange: 'NASDAQ', name_ko: '애플', name_en: 'Apple', query_terms: ['Apple', '애플', 'AAPL'], exclude_terms: [] },
  { market: 'us', ticker: 'MSFT', exchange: 'NASDAQ', name_ko: '마이크로소프트', name_en: 'Microsoft', query_terms: ['Microsoft', '마이크로소프트', 'MSFT'], exclude_terms: [] },
  { market: 'us', ticker: 'NVDA', exchange: 'NASDAQ', name_ko: '엔비디아', name_en: 'NVIDIA', query_terms: ['NVIDIA', '엔비디아', 'NVDA'], exclude_terms: [] },
  { market: 'us', ticker: 'GOOGL', exchange: 'NASDAQ', name_ko: '알파벳', name_en: 'Alphabet', query_terms: ['Alphabet', 'Google', '구글', '알파벳', 'GOOGL'], exclude_terms: [] },
  { market: 'us', ticker: 'AMZN', exchange: 'NASDAQ', name_ko: '아마존', name_en: 'Amazon', query_terms: ['Amazon', '아마존', 'AMZN', 'AWS'], exclude_terms: [] },
  { market: 'us', ticker: 'META', exchange: 'NASDAQ', name_ko: '메타', name_en: 'Meta Platforms', query_terms: ['Meta', '메타', 'Facebook', '페이스북', 'META'], exclude_terms: [] },
  { market: 'us', ticker: 'TSLA', exchange: 'NASDAQ', name_ko: '테슬라', name_en: 'Tesla', query_terms: ['Tesla', '테슬라', 'TSLA'], exclude_terms: [] },
  { market: 'us', ticker: 'BRK.B', exchange: 'NYSE', name_ko: '버크셔해서웨이', name_en: 'Berkshire Hathaway', query_terms: ['Berkshire Hathaway', '버크셔', 'Warren Buffett'], exclude_terms: [] },
  { market: 'us', ticker: 'AVGO', exchange: 'NASDAQ', name_ko: '브로드컴', name_en: 'Broadcom', query_terms: ['Broadcom', '브로드컴', 'AVGO'], exclude_terms: [] },
  { market: 'us', ticker: 'JPM', exchange: 'NYSE', name_ko: 'JP모건', name_en: 'JPMorgan Chase', query_terms: ['JPMorgan', 'JP모건', 'JPM'], exclude_terms: [] },
  { market: 'us', ticker: 'LLY', exchange: 'NYSE', name_ko: '일라이릴리', name_en: 'Eli Lilly', query_terms: ['Eli Lilly', '일라이릴리', 'LLY'], exclude_terms: [] },
  { market: 'us', ticker: 'V', exchange: 'NYSE', name_ko: '비자', name_en: 'Visa', query_terms: ['Visa', '비자'], exclude_terms: [] },
  { market: 'us', ticker: 'UNH', exchange: 'NYSE', name_ko: '유나이티드헬스', name_en: 'UnitedHealth', query_terms: ['UnitedHealth', '유나이티드헬스', 'UNH'], exclude_terms: [] },
  { market: 'us', ticker: 'XOM', exchange: 'NYSE', name_ko: '엑슨모빌', name_en: 'Exxon Mobil', query_terms: ['Exxon Mobil', '엑슨모빌', 'XOM'], exclude_terms: [] },
  { market: 'us', ticker: 'MA', exchange: 'NYSE', name_ko: '마스터카드', name_en: 'Mastercard', query_terms: ['Mastercard', '마스터카드', 'MA'], exclude_terms: [] },
  { market: 'us', ticker: 'COST', exchange: 'NASDAQ', name_ko: '코스트코', name_en: 'Costco', query_terms: ['Costco', '코스트코', 'COST'], exclude_terms: [] },
  { market: 'us', ticker: 'JNJ', exchange: 'NYSE', name_ko: '존슨앤존슨', name_en: 'Johnson & Johnson', query_terms: ['Johnson & Johnson', '존슨앤존슨', 'JNJ'], exclude_terms: [] },
  { market: 'us', ticker: 'HD', exchange: 'NYSE', name_ko: '홈디포', name_en: 'Home Depot', query_terms: ['Home Depot', '홈디포', 'HD'], exclude_terms: [] },
  { market: 'us', ticker: 'PG', exchange: 'NYSE', name_ko: 'P&G', name_en: 'Procter & Gamble', query_terms: ['Procter & Gamble', 'P&G', 'PG'], exclude_terms: [] },
  { market: 'us', ticker: 'ABBV', exchange: 'NYSE', name_ko: '애브비', name_en: 'AbbVie', query_terms: ['AbbVie', '애브비', 'ABBV'], exclude_terms: [] },
  { market: 'us', ticker: 'WMT', exchange: 'NYSE', name_ko: '월마트', name_en: 'Walmart', query_terms: ['Walmart', '월마트', 'WMT'], exclude_terms: [] },
  { market: 'us', ticker: 'NFLX', exchange: 'NASDAQ', name_ko: '넷플릭스', name_en: 'Netflix', query_terms: ['Netflix', '넷플릭스', 'NFLX'], exclude_terms: [] },
  { market: 'us', ticker: 'CRM', exchange: 'NYSE', name_ko: '세일즈포스', name_en: 'Salesforce', query_terms: ['Salesforce', '세일즈포스', 'CRM'], exclude_terms: [] },
  { market: 'us', ticker: 'AMD', exchange: 'NASDAQ', name_ko: 'AMD', name_en: 'AMD', query_terms: ['AMD', 'Advanced Micro Devices'], exclude_terms: [] },
  { market: 'us', ticker: 'ORCL', exchange: 'NYSE', name_ko: '오라클', name_en: 'Oracle', query_terms: ['Oracle', '오라클', 'ORCL'], exclude_terms: [] },
];

export const TOP50 = [...TOP50_KR, ...TOP50_US];

/**
 * 티커로 종목 찾기
 */
export function findByTicker(market, ticker) {
  return TOP50.find(s => s.market === market && s.ticker === ticker);
}

/**
 * 시장별 종목 리스트
 */
export function getByMarket(market) {
  return TOP50.filter(s => s.market === market);
}

export default TOP50;
