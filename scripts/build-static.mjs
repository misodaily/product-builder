import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

import { TOP50, TOP50_KR, TOP50_US, findStock } from '../src/data/top50.js';
import { SAMPLE_EVENTS } from '../src/data/events.js';
import {
  renderHomePage,
  renderStockPage,
  renderEventPage,
  generateEventJsonLd,
  formatDate
} from '../src/render/render.js';

const SITE_URL = 'https://misodaily.web.app';
const BUILD_TIME = new Date('2026-02-04T15:00:00+09:00');

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const publicDir = path.join(projectRoot, 'public');

async function ensureDir(dirPath) {
  await fs.mkdir(dirPath, { recursive: true });
}

function applyTemplate(template, data) {
  let html = template;
  for (const [key, value] of Object.entries(data)) {
    html = html.replaceAll(`{{${key}}}`, value ?? '');
  }
  return html;
}

function buildMeta({ title, description, url, ogType = 'website' }) {
  return {
    TITLE: title,
    DESCRIPTION: description,
    CANONICAL: url,
    OG_TITLE: title,
    OG_DESCRIPTION: description,
    OG_URL: url,
    OG_IMAGE: `${SITE_URL}/og.png`,
    OG_TYPE: ogType,
    TWITTER_TITLE: title,
    TWITTER_DESCRIPTION: description,
  };
}

async function writePage(outPath, template, meta, content, nav = {}, jsonLd = null) {
  const jsonLdBlock = jsonLd
    ? `<script type="application/ld+json" id="jsonld">${jsonLd}</script>`
    : '';
  const html = applyTemplate(template, {
    ...meta,
    CONTENT: content,
    JSON_LD_BLOCK: jsonLdBlock,
    NAV_HOME: nav.home ? 'active' : '',
    NAV_KR: nav.kr ? 'active' : '',
    NAV_US: nav.us ? 'active' : '',
  });
  await ensureDir(path.dirname(outPath));
  await fs.writeFile(outPath, html, 'utf8');
}

function isoDate(date) {
  return date.toISOString().split('T')[0];
}

async function build() {
  const templatePath = path.join(projectRoot, 'src', 'templates', 'base.html');
  const template = await fs.readFile(templatePath, 'utf8');

  await fs.rm(publicDir, { recursive: true, force: true });
  await ensureDir(publicDir);

  const homeTitle = 'TOP50 종목 사건 아카이브 | miso_daily';
  const homeDesc = '국내외 TOP50 종목의 주요 사건을 실시간으로 정리합니다. 실적, 수주, 규제, 소송 등 투자에 중요한 이슈를 사건 단위로 확인하세요.';

  await writePage(
    path.join(publicDir, 'index.html'),
    template,
    buildMeta({ title: homeTitle, description: homeDesc, url: `${SITE_URL}/top50/` }),
    renderHomePage(null),
    { home: true }
  );

  await writePage(
    path.join(publicDir, 'top50', 'index.html'),
    template,
    buildMeta({ title: homeTitle, description: homeDesc, url: `${SITE_URL}/top50/` }),
    renderHomePage(null),
    { home: true }
  );

  await writePage(
    path.join(publicDir, 'top50', 'kr', 'index.html'),
    template,
    buildMeta({
      title: '국내 TOP25 종목 사건 아카이브 | miso_daily',
      description: '국내 TOP25 종목의 주요 사건을 사건 단위로 정리합니다. 실적, 규제, 수주 등 핵심 이슈를 빠르게 확인하세요.',
      url: `${SITE_URL}/top50/kr/`
    }),
    renderHomePage('kr'),
    { kr: true }
  );

  await writePage(
    path.join(publicDir, 'top50', 'us', 'index.html'),
    template,
    buildMeta({
      title: '미국 TOP25 종목 사건 아카이브 | miso_daily',
      description: '미국 TOP25 종목의 주요 사건을 사건 단위로 정리합니다. 실적, 규제, 수주 등 핵심 이슈를 빠르게 확인하세요.',
      url: `${SITE_URL}/top50/us/`
    }),
    renderHomePage('us'),
    { us: true }
  );

  for (const stock of TOP50) {
    const url = `${SITE_URL}/stocks/${stock.market}/${stock.ticker}/`;
    const title = `${stock.name_ko} (${stock.ticker}) 사건 아카이브 | miso_daily`;
    const description = `${stock.name_ko}의 주요 사건을 사건 단위로 정리합니다. 실적, 규제, 수주, 소송 등 투자에 중요한 이슈를 확인하세요.`;

    await writePage(
      path.join(publicDir, 'stocks', stock.market, stock.ticker, 'index.html'),
      template,
      buildMeta({ title, description, url }),
      renderStockPage(stock.market, stock.ticker),
      { [stock.market]: true }
    );
  }

  for (const event of SAMPLE_EVENTS) {
    const stock = findStock(event.market, event.ticker);
    if (!stock) continue;
    const dateStr = formatDate(event.startedAt);
    const title = `${stock.name_ko} ${event.summary2[0]} (${dateStr}) | miso_daily`;
    const description = `${event.summary2.join(' ')} ${event.why}`;
    const url = `${SITE_URL}/stocks/${event.market}/${event.ticker}/events/${event.id}/`;
    const jsonLd = JSON.stringify(generateEventJsonLd(event, stock));

    await writePage(
      path.join(publicDir, 'stocks', event.market, event.ticker, 'events', event.id, 'index.html'),
      template,
      buildMeta({ title, description, url, ogType: 'article' }),
      renderEventPage(event.market, event.ticker, event.id),
      { [event.market]: true },
      jsonLd
    );
  }

  const urls = [
    { loc: `${SITE_URL}/top50/`, lastmod: isoDate(BUILD_TIME) },
    { loc: `${SITE_URL}/top50/kr/`, lastmod: isoDate(BUILD_TIME) },
    { loc: `${SITE_URL}/top50/us/`, lastmod: isoDate(BUILD_TIME) },
    ...TOP50.map(stock => ({
      loc: `${SITE_URL}/stocks/${stock.market}/${stock.ticker}/`,
      lastmod: isoDate(BUILD_TIME)
    })),
    ...SAMPLE_EVENTS.map(event => ({
      loc: `${SITE_URL}/stocks/${event.market}/${event.ticker}/events/${event.id}/`,
      lastmod: isoDate(new Date(event.updatedAt))
    }))
  ];

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    urls.map(u => `  <url><loc>${u.loc}</loc><lastmod>${u.lastmod}</lastmod></url>`).join('\n') +
    `\n</urlset>\n`;

  await fs.writeFile(path.join(publicDir, 'sitemap.xml'), sitemap, 'utf8');
  await fs.writeFile(
    path.join(publicDir, 'robots.txt'),
    `User-agent: *\nAllow: /\nSitemap: ${SITE_URL}/sitemap.xml\n`,
    'utf8'
  );

  await ensureDir(path.join(publicDir, 'assets'));
  const clientPath = path.join(projectRoot, 'src', 'client', 'app.js');
  const clientJs = await fs.readFile(clientPath, 'utf8');
  await fs.writeFile(path.join(publicDir, 'assets', 'app.js'), clientJs, 'utf8');

  const ogSource = path.join(projectRoot, 'src', 'assets', 'og.png');
  await fs.copyFile(ogSource, path.join(publicDir, 'og.png'));
}

build().catch((err) => {
  console.error(err);
  process.exit(1);
});
