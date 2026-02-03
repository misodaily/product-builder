const {onSchedule} = require("firebase-functions/v2/scheduler");
const {onRequest} = require("firebase-functions/v2/https");
const admin = require("firebase-admin");
const axios = require("axios");

admin.initializeApp();

/**
 * 뉴스 소스별 RSS/API 엔드포인트 설정
 * 실제 운영시에는 각 언론사의 RSS 피드나 API를 사용
 */
const NEWS_SOURCES = {
  semiconductor: [
    "https://www.mtnews.net/rss/S1N4.xml", // 반도체
    "https://www.etnews.com/rss/S1N1.xml"
  ],
  ai: [
    "https://www.aitimes.com/rss/allArticle.xml"
  ],
  bio: [
    "https://www.thebionews.net/rss/allArticle.xml"
  ],
  auto: [
    "https://www.autoherald.co.kr/rss/allArticle.xml"
  ],
  // 다른 카테고리들도 추가...
};

/**
 * 뉴스 데이터 수집 함수
 */
async function fetchNews() {
  const headlines = [];

  // 각 카테고리별로 최신 뉴스 5개씩 수집
  for (const [category, sources] of Object.entries(NEWS_SOURCES)) {
    for (const source of sources) {
      try {
        // RSS 피드나 API에서 뉴스 수집
        // 실제 구현시에는 axios + cheerio로 RSS 파싱
        const response = await axios.get(source, {
          timeout: 10000,
          headers: {
            'User-Agent': 'miso_daily/1.0'
          }
        });

        // RSS 파싱 로직 (여기서는 예시)
        // 실제로는 cheerio를 사용하여 XML 파싱
        // const $ = cheerio.load(response.data, { xmlMode: true });

        // 파싱된 뉴스를 headlines 배열에 추가
        // headlines.push({...});

      } catch (error) {
        console.error(`Error fetching ${category} from ${source}:`, error.message);
      }
    }
  }

  return headlines;
}

/**
 * Firestore에 뉴스 데이터 저장
 */
async function saveToFirestore(headlines, snapshot) {
  const db = admin.firestore();
  const batch = db.batch();

  const newsRef = db.collection('news').doc('latest');
  const payload = {
    updatedAtISO: new Date().toISOString()
  };

  if (Array.isArray(headlines)) {
    payload.headlines = headlines;
  }

  if (Array.isArray(snapshot)) {
    payload.snapshot = snapshot;
  }

  batch.set(newsRef, payload, { merge: true });

  await batch.commit();
  const count = Array.isArray(headlines) ? headlines.length : 0;
  console.log(`Saved ${count} headlines to Firestore`);
}

/**
 * 오전 9시 뉴스 업데이트 (KST 기준)
 * 매일 오전 9시에 실행 (Cron: 0 9 * * *)
 */
exports.updateMorningNews = onSchedule({
  schedule: "0 9 * * *",
  timeZone: "Asia/Seoul",
  memory: "256MiB",
  timeoutSeconds: 300
}, async (event) => {
  console.log("Morning news update started at", new Date().toISOString());

  try {
    const headlines = await fetchNews();
    await saveToFirestore(headlines, null);
    console.log("Morning news update completed successfully");
    return { success: true, count: headlines.length };
  } catch (error) {
    console.error("Morning news update failed:", error);
    throw error;
  }
});

/**
 * 오후 6시 뉴스 업데이트 (KST 기준)
 * 매일 오후 6시에 실행 (Cron: 0 18 * * *)
 */
exports.updateEveningNews = onSchedule({
  schedule: "0 18 * * *",
  timeZone: "Asia/Seoul",
  memory: "256MiB",
  timeoutSeconds: 300
}, async (event) => {
  console.log("Evening news update started at", new Date().toISOString());

  try {
    const headlines = await fetchNews();
    await saveToFirestore(headlines, null);
    console.log("Evening news update completed successfully");
    return { success: true, count: headlines.length };
  } catch (error) {
    console.error("Evening news update failed:", error);
    throw error;
  }
});

/**
 * 수동 뉴스 업데이트용 HTTP 엔드포인트
 * 테스트나 즉시 업데이트가 필요할 때 사용
 * URL: https://your-project.cloudfunctions.net/manualUpdateNews
 */
exports.manualUpdateNews = onRequest({
  cors: true,
  memory: "256MiB",
  timeoutSeconds: 300
}, async (req, res) => {
  console.log("Manual news update requested");

  try {
    const headlines = await fetchNews();
    await saveToFirestore(headlines, null);

    res.json({
      success: true,
      message: "News updated successfully",
      count: headlines.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error("Manual news update failed:", error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Firestore에서 최신 뉴스 조회 API
 * URL: https://your-project.cloudfunctions.net/getLatestNews
 */
exports.getLatestNews = onRequest({
  cors: true
}, async (req, res) => {
  try {
    const db = admin.firestore();
    const newsDoc = await db.collection('news').doc('latest').get();

    if (!newsDoc.exists) {
      res.status(404).json({
        success: false,
        error: "No news data found"
      });
      return;
    }

    res.json({
      success: true,
      data: newsDoc.data()
    });
  } catch (error) {
    console.error("Error fetching news:", error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

const STOOQ_BASE = "https://stooq.com/q/d/l/";
const STOOQ_INDICES = [
  { name: "KOSPI", symbols: ["^KOSPI", "^KS11"] },
  { name: "KOSDAQ", symbols: ["^KOSDAQ", "^KQ11"] },
  { name: "NASDAQ", symbols: ["^NDQ", "^IXIC"] },
  { name: "S&P 500", symbols: ["^SPX", "^GSPC"] },
  { name: "Dow Jones", symbols: ["^DJI", "^DJIA"] },
  { name: "VIX", symbols: ["^VIX"] },
  { name: "원/달러", symbols: ["USDKRW"] }
];

function parseStooqCsv(csvText) {
  const lines = String(csvText).trim().split(/\r?\n/);
  if (lines.length < 2) {
    throw new Error("Stooq CSV has no data rows");
  }

  const rows = lines.slice(1)
    .map((line) => line.split(","))
    .filter((cols) => cols.length >= 5 && cols[0] && cols[4]);

  rows.sort((a, b) => new Date(a[0]) - new Date(b[0]));
  return rows;
}

async function fetchStooqDaily(symbol) {
  const url = `${STOOQ_BASE}?s=${encodeURIComponent(symbol)}&i=d`;
  const response = await axios.get(url, {
    timeout: 10000,
    responseType: "text",
    headers: { "User-Agent": "miso_daily/1.0" }
  });

  const rows = parseStooqCsv(response.data);
  const last = rows[rows.length - 1];
  const prev = rows.length > 1 ? rows[rows.length - 2] : null;

  const lastDate = last[0];
  const lastClose = Number(last[4]);
  const prevClose = prev ? Number(prev[4]) : lastClose;

  const change = lastClose - prevClose;
  const changePct = prevClose ? (change / prevClose) * 100 : 0;

  return {
    date: lastDate,
    value: lastClose,
    change,
    changePct
  };
}

async function fetchStooqDailyWithFallback(symbols) {
  const errors = [];
  for (const symbol of symbols) {
    try {
      const data = await fetchStooqDaily(symbol);
      return { symbol, data };
    } catch (error) {
      errors.push(`${symbol}: ${error.message}`);
    }
  }
  throw new Error(`Stooq fetch failed for all symbols (${errors.join("; ")})`);
}

async function fetchSnapshotFromStooq() {
  const snapshot = [];
  for (const item of STOOQ_INDICES) {
    try {
      const result = await fetchStooqDailyWithFallback(item.symbols);
      const data = result.data;
      snapshot.push({
        name: item.name,
        symbol: result.symbol,
        asOf: data.date,
        value: data.value,
        change: data.change,
        changePct: data.changePct
      });
    } catch (error) {
      console.error(`Stooq fetch failed for ${item.name}:`, error.message);
    }
  }
  return snapshot;
}

async function getCurrentSnapshotMeta() {
  const db = admin.firestore();
  const doc = await db.collection('news').doc('latest').get();
  if (!doc.exists) return {};
  const data = doc.data();
  const map = {};
  if (Array.isArray(data.snapshot)) {
    data.snapshot.forEach((item) => {
      if (item && item.name && item.asOf) {
        map[item.name] = item.asOf;
      }
    });
  }
  return map;
}

function isSnapshotUpdated(existingMeta, nextSnapshot) {
  if (nextSnapshot.length !== STOOQ_INDICES.length) return false;
  for (const item of nextSnapshot) {
    if (!existingMeta[item.name] || existingMeta[item.name] !== item.asOf) {
      return true;
    }
  }
  return false;
}

/**
 * 전일 종가 기준 지수 업데이트 (5분마다 확인)
 */
exports.updateDailySnapshot = onSchedule({
  schedule: "*/5 * * * *",
  timeZone: "Asia/Seoul",
  memory: "256MiB",
  timeoutSeconds: 120
}, async () => {
  console.log("Daily snapshot update started at", new Date().toISOString());

  try {
    const snapshot = await fetchSnapshotFromStooq();
    if (snapshot.length !== STOOQ_INDICES.length) {
      throw new Error("Incomplete snapshot data collected from Stooq");
    }

    const existingMeta = await getCurrentSnapshotMeta();
    if (!isSnapshotUpdated(existingMeta, snapshot)) {
      console.log("No new snapshot data. Skipping Firestore update.");
      return { success: true, count: snapshot.length, updated: false };
    }

    await saveToFirestore(null, snapshot);
    console.log("Daily snapshot update completed");
    return { success: true, count: snapshot.length, updated: true };
  } catch (error) {
    console.error("Daily snapshot update failed:", error);
    throw error;
  }
});

/**
 * 수동 지수 업데이트용 HTTP 엔드포인트
 */
exports.manualUpdateSnapshot = onRequest({
  cors: true,
  memory: "256MiB",
  timeoutSeconds: 120
}, async (req, res) => {
  try {
    const snapshot = await fetchSnapshotFromStooq();
    if (snapshot.length !== STOOQ_INDICES.length) {
      res.status(500).json({ success: false, error: "Incomplete snapshot data collected" });
      return;
    }

    await saveToFirestore(null, snapshot);
    res.json({
      success: true,
      count: snapshot.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error("Manual snapshot update failed:", error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});
