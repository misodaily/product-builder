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
async function saveToFirestore(headlines) {
  const db = admin.firestore();
  const batch = db.batch();

  const newsRef = db.collection('news').doc('latest');
  batch.set(newsRef, {
    updatedAtISO: new Date().toISOString(),
    headlines: headlines,
    snapshot: [
      { name:"KOSPI", value: 2580.45, change: +22.35, changePct: +0.87 },
      { name:"KOSDAQ", value: 745.82, change: -3.15, changePct: -0.42 },
      { name:"원/달러", value: 1345.20, change: -5.80, changePct: -0.43 },
      { name:"한은 기준금리", value: 2.50, change: 0, changePct: 0 },
    ]
  }, { merge: true });

  await batch.commit();
  console.log(`Saved ${headlines.length} headlines to Firestore`);
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
    await saveToFirestore(headlines);
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
    await saveToFirestore(headlines);
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
    await saveToFirestore(headlines);

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
