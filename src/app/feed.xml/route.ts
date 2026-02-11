import { BASE_URL, MAIN_PAGES, REGION_PAGES } from '@/lib/urls';

export const dynamic = 'force-static';

export async function GET() {
  const now = new Date();
  const pubDate = now.toUTCString();

  const items: string[] = [];

  // 메인 페이지
  items.push(`
    <item>
      <title><![CDATA[주차장 정보 - 전국 주차장 검색, 요금 비교]]></title>
      <link>${BASE_URL}</link>
      <guid>${BASE_URL}</guid>
      <description><![CDATA[전국 주차장 위치, 운영시간, 요금 정보를 한눈에 비교하세요. 공영·민영 주차장, 무료 주차장, 24시간 주차장까지 지역별로 검색할 수 있습니다.]]></description>
      <pubDate>${pubDate}</pubDate>
    </item>`);

  // 주요 페이지
  MAIN_PAGES.forEach((page) => {
    const url = `${BASE_URL}${page.path}`;
    items.push(`
    <item>
      <title><![CDATA[${page.title} - ${page.description}]]></title>
      <link>${url}</link>
      <guid>${url}</guid>
      <description><![CDATA[${page.description}]]></description>
      <pubDate>${pubDate}</pubDate>
    </item>`);
  });

  // 지역 페이지
  REGION_PAGES.forEach((page) => {
    const url = `${BASE_URL}${page.path}`;
    items.push(`
    <item>
      <title><![CDATA[${page.title} - ${page.description}]]></title>
      <link>${url}</link>
      <guid>${url}</guid>
      <description><![CDATA[${page.description}]]></description>
      <pubDate>${pubDate}</pubDate>
    </item>`);
  });

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>주차장 정보 - 전국 주차장 검색, 요금 비교</title>
    <link>${BASE_URL}</link>
    <description>전국 주차장 위치, 운영시간, 요금 정보를 한눈에 비교하세요.</description>
    <language>ko</language>
    <lastBuildDate>${now.toUTCString()}</lastBuildDate>
    <atom:link href="${BASE_URL}/feed.xml" rel="self" type="application/rss+xml"/>
    ${items.join('')}
  </channel>
</rss>`;

  return new Response(rss, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=604800, s-maxage=604800',
    },
  });
}
