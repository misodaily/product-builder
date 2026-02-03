# miso_daily 자동 뉴스 업데이트 시스템 설치 가이드

## 📋 개요

miso_daily는 하루 2회 (오전 9시, 오후 6시) 자동으로 최신 뉴스를 업데이트하는 주식 브리핑 시스템입니다.

## 🚀 설치 방법

### 1. Firebase CLI 설치

```bash
npm install -g firebase-tools
```

### 2. Firebase 로그인

```bash
firebase login
```

### 3. Firebase 프로젝트 초기화

```bash
firebase init
```

선택 옵션:
- ✅ Firestore
- ✅ Functions
- ✅ Hosting

### 4. Functions 의존성 설치

```bash
cd functions
npm install
cd ..
```

### 5. 배포

```bash
firebase deploy
```

## ⏰ 자동 업데이트 스케줄

### 오전 업데이트
- **시간**: 매일 오전 9시 (KST)
- **함수**: `updateMorningNews`
- **내용**: 전일 저녁 ~ 당일 오전 뉴스

### 오후 업데이트
- **시간**: 매일 오후 6시 (KST)
- **함수**: `updateEveningNews`
- **내용**: 당일 오전 ~ 오후 뉴스

## 🔧 수동 업데이트 방법

### 브라우저에서 직접 업데이트

```
https://YOUR-PROJECT-ID.cloudfunctions.net/manualUpdateNews
```

### curl 명령어

```bash
curl -X GET https://YOUR-PROJECT-ID.cloudfunctions.net/manualUpdateNews
```

## 📊 뉴스 카테고리

총 12개 카테고리별로 각 5개 이상의 기사를 자동 수집:

1. 반도체 (semiconductor)
2. 인공지능 (ai)
3. 바이오 (bio)
4. 자동차 (auto)
5. 우주항공/방산 (aerospace)
6. 금융/은행 (finance)
7. 로봇 (robot)
8. 철강 (steel)
9. 화학 (chemical)
10. 거시경제 (macro)
11. 기업실적 (earnings)
12. 에너지 (energy)

## 📰 뉴스 소스

### 반도체
- 전자신문 (www.etnews.com)
- 서울신문 (www.seoul.co.kr)
- 비즈니스포스트 (www.businesspost.co.kr)

### AI
- AI타임스 (www.aitimes.com)
- 정책브리핑 (www.korea.kr)
- CIO Korea (www.cio.com)

### 바이오
- 더바이오뉴스 (www.thebionews.net)
- 팜뉴스 (www.pharmnews.com)
- 데일리팜 (www.dailypharm.com)

(기타 카테고리별 출처 생략...)

## 🏗️ 프로젝트 구조

```
misodaily/
├── index.html              # 메인 페이지
├── firebase.json           # Firebase 설정
├── functions/
│   ├── package.json        # Functions 의존성
│   ├── index.js            # 스케줄러 함수
│   └── newsCollector.js    # 뉴스 수집 로직
└── SETUP.md                # 이 파일
```

## 🔑 환경 변수

Firebase Functions에서 API 키가 필요한 경우:

```bash
firebase functions:config:set news.api_key="YOUR_API_KEY"
```

## 📝 Firestore 데이터 구조

```javascript
{
  "news/latest": {
    "updatedAtISO": "2026-02-03T12:00:00Z",
    "snapshot": [
      { "name": "KOSPI", "value": 2580.45, "change": +22.35, "changePct": +0.87 }
    ],
    "headlines": [
      {
        "title": "뉴스 제목",
        "summary": "뉴스 요약",
        "tag": "semiconductor",
        "source": "서울신문",
        "timeISO": "2026-02-03T10:30:00Z",
        "url": "https://..."
      }
    ]
  }
}
```

## 🧪 로컬 테스트

Firebase Emulator로 로컬 테스트:

```bash
firebase emulators:start
```

Functions Emulator: http://localhost:5001
Firestore Emulator: http://localhost:8080

## 📊 모니터링

### Firebase Console에서 확인
1. Firebase Console (https://console.firebase.google.com) 접속
2. Functions 섹션에서 실행 로그 확인
3. Firestore 섹션에서 데이터 확인

### 로그 확인

```bash
firebase functions:log --only updateMorningNews
firebase functions:log --only updateEveningNews
```

## 💰 비용 예상

### Firebase Functions (하루 2회 실행)
- 무료 티어: 2백만 호출/월
- 예상 호출: 60회/월
- **비용: 무료**

### Firestore
- 무료 티어: 읽기 50K/일, 쓰기 20K/일
- 예상 사용량: 쓰기 2회/일
- **비용: 무료**

### Firebase Hosting
- 무료 티어: 10GB 저장소, 360MB/일 전송
- **비용: 무료**

## 🔄 업데이트 프로세스

1. **RSS 피드 수집**: 각 카테고리별 뉴스 소스에서 RSS 수집
2. **키워드 필터링**: 카테고리별 키워드로 관련 기사 분류
3. **중복 제거**: 동일 제목 기사 제거
4. **Firestore 저장**: 최신 60개 기사 저장 (카테고리당 5개)
5. **실시간 반영**: 프론트엔드에서 자동으로 업데이트 표시

## 🐛 트러블슈팅

### Functions 배포 실패
```bash
firebase deploy --only functions --debug
```

### RSS 파싱 오류
- newsCollector.js의 parseRSSFeed 함수 확인
- RSS 피드 URL이 유효한지 확인

### Firestore 권한 오류
```bash
firebase firestore:rules update
```

## 📞 지원

문제가 발생하면 GitHub Issues에 등록해주세요.

## 📄 라이선스

MIT License

---

© 2026 miso_daily - 자동화된 주식 소식 브리핑
