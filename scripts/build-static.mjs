// scripts/build-static.mjs
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Resolve __dirname equivalent in ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import data
import { TOP50_KR, TOP50_US, TOP50 } from '../src/data/top50.js';
import { EVENT_LABELS, SAMPLE_EVENTS } from '../src/data/events.js';

// Import rendering functions
import {
  findStock, getEventsByTicker, getEventsByTimeframe, getEventById,
  formatRelTime, formatDateTime, formatDate, escapeHtml,
  renderStockGrid, renderEventCard, renderHomePage, renderStockPage, renderEventPage, renderNotFound, renderConfidenceBadge
} from '../src/render/render.js';

const PUBLIC_DIR = path.resolve(__dirname, '../public');
const TEMPLATES_DIR = path.resolve(__dirname, '../src/templates');

async function ensureDir(dirPath) {
  await fs.mkdir(dirPath, { recursive: true });
}

function renderBaseTemplate(content, pageMeta = {}) {
  let template = fs.readFileSync(path.join(TEMPLATES_DIR, 'base.html'), 'utf-8');

  // Replace SEO placeholders
  template = template.replace('{{ page.title }}', pageMeta.title || 'TOP50 종목 사건 아카이브 | miso_daily');
  template = template.replace('{{ page.description }}', pageMeta.description || '국내외 TOP50 종목의 주요 사건을 실시간으로 정리합니다. 실적, 수주, 규제, 소송 등 투자에 중요한 이슈를 사건 단위로 확인하세요.');
  template = template.replace('{{ page.canonical }}', pageMeta.canonical || 'https://example.com/top50'); // Placeholder, will be replaced with actual URL
  template = template.replace('{{ page.og_title }}', pageMeta.og_title || pageMeta.title || 'TOP50 종목 사건 아카이브 | miso_daily');
  template = template.replace('{{ page.og_description }}', pageMeta.og_description || pageMeta.description || '국내외 TOP50 종목의 주요 사건을 실시간으로 정리합니다. 실적, 수주, 규제, 소송 등 투자에 중요한 이슈를 사건 단위로 확인하세요.');
  template = template.replace('{{ page.og_url }}', pageMeta.og_url || pageMeta.canonical || 'https://example.com/top50');
  template = template.replace('{{ page.og_image }}', pageMeta.og_image || '/og.png');
  template = template.replace('{{ page.twitter_title }}', pageMeta.twitter_title || pageMeta.title || 'TOP50 종목 사건 아카이브 | miso_daily');
  template = template.replace('{{ page.twitter_description }}', pageMeta.twitter_description || pageMeta.description || '국내외 TOP50 종목의 주요 사건을 실시간으로 정리합니다. 실적, 수주, 규제, 소송 등 투자에 중요한 이슈를 사건 단위로 확인하세요.');
  template = template.replace('{{ page.twitter_image }}', pageMeta.twitter_image || '/og.png');

  return template.replace('<!--APP_CONTENT-->', content);
}

async function buildPage(route, content, pageMeta = {}) {
  const filePath = path.join(PUBLIC_DIR, route, 'index.html');
  await ensureDir(path.dirname(filePath));

  const finalHtml = renderBaseTemplate(content, pageMeta);
  await fs.writeFile(filePath, finalHtml);
}

async function generateStaticPages() {
  console.log('Generating static pages...');

  // Home Page
  await buildPage('/top50', renderHomePage({ marketFilter: undefined, timeframe: '24h' }), {
    title: 'TOP50 종목 사건 아카이브 | miso_daily',
    description: '국내외 TOP50 종목의 주요 사건을 실시간으로 정리합니다. 실적, 수주, 규제, 소송 등 투자에 중요한 이슈를 사건 단위로 확인하세요.',
    canonical: 'https://example.com/top50',
    og_image: '/og.png',
  });
  await buildPage('/top50/kr', renderHomePage({ marketFilter: 'kr', timeframe: '24h' }), {
    title: '국내 TOP25 종목 | miso_daily',
    description: '국내 TOP25 종목의 주요 사건을 실시간으로 정리합니다.',
    canonical: 'https://example.com/top50/kr',
    og_image: '/og.png',
  });
  await buildPage('/top50/us', renderHomePage({ marketFilter: 'us', timeframe: '24h' }), {
    title: '미국 TOP25 종목 | miso_daily',
    description: '미국 TOP25 종목의 주요 사건을 실시간으로 정리합니다.',
    canonical: 'https://example.com/top50/us',
    og_image: '/og.png',
  });

  // Stock Pages
  for (const stock of TOP50) {
    const stockPath = `/stocks/${stock.market}/${stock.ticker}`;
    await buildPage(stockPath, renderStockPage(stock.market, stock.ticker, '24h'), {
      title: `${stock.name_ko} (${stock.ticker}) 사건 아카이브 | miso_daily`,
      description: `${stock.name_ko}의 최근 주요 사건을 확인하세요. 실적, 수주, 규제 등 투자에 중요한 이슈를 사건 단위로 정리합니다.`,
      canonical: `https://example.com${stockPath}`,
      og_image: '/og.png',
    });

    // Event Pages
    const events = getEventsByTicker(stock.market, stock.ticker);
    for (const event of events) {
      const eventPath = `${stockPath}/events/${event.id}`;
      const dateStr = formatDate(event.startedAt);
      const eventTitle = `${stock.name_ko} ${event.summary2[0]} (${dateStr})`;
      await buildPage(eventPath, renderEventPage(stock.market, stock.ticker, event.id), {
        title: `${eventTitle} | miso_daily`,
        description: `${event.summary2.join(' ')} ${event.why}`,
        canonical: `https://example.com${eventPath}`,
        og_image: '/og.png',
      });
    }
  }

  // sitemap.xml
  let sitemapContent = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;
  const allRoutes = ['/top50', '/top50/kr', '/top50/us'];
  for (const stock of TOP50) {
    allRoutes.push(`/stocks/${stock.market}/${stock.ticker}`);
    const events = getEventsByTicker(stock.market, stock.ticker);
    for (const event of events) {
      allRoutes.push(`/stocks/${stock.market}/${stock.ticker}/events/${event.id}`);
    }
  }

  for (const route of allRoutes) {
    sitemapContent += `  <url>\n    <loc>https://example.com${route}</loc>\n    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>\n    <changefreq>daily</changefreq>\n    <priority>0.7</priority>\n  </url>\n`;
  }
  sitemapContent += `</urlset>`;
  await fs.writeFile(path.join(PUBLIC_DIR, 'sitemap.xml'), sitemapContent);
  console.log('sitemap.xml generated.');

  // robots.txt
  const robotsContent = `User-agent: *\nAllow: /\n\nSitemap: https://example.com/sitemap.xml`;
  await fs.writeFile(path.join(PUBLIC_DIR, 'robots.txt'), robotsContent);
  console.log('robots.txt generated.');

  console.log('Static pages generation complete!');
}

generateStaticPages().catch(console.error);
