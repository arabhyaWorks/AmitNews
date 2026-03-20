import { NextResponse } from 'next/server';

const BOT_AGENTS = /whatsapp|facebookexternalhit|twitterbot|telegrambot|slackbot|linkedinbot|discordbot|googlebot|bingbot|applebot|pinterest|vkshare|w3c_validator/i;

const BACKEND = process.env.REACT_APP_API_URL || 'https://backend.radarone.in';

export async function middleware(request) {
  const ua = request.headers.get('user-agent') || '';
  if (!BOT_AGENTS.test(ua)) return NextResponse.next();

  const url = new URL(request.url);
  const match = url.pathname.match(/^\/article\/([^/]+)/);
  if (!match) return NextResponse.next();

  const articleId = match[1];

  try {
    const res = await fetch(`${BACKEND}/api/public/articles/${articleId}`);
    if (!res.ok) return NextResponse.next();
    const { data: article } = await res.json();

    const title = article.title || 'RadarOne News';
    const description = (article.content || '').replace(/<[^>]+>/g, '').slice(0, 200);
    const image = article.image_url || '';
    const pageUrl = request.url;

    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(description)}"/>
  <meta property="og:type" content="article"/>
  <meta property="og:title" content="${escapeHtml(title)}"/>
  <meta property="og:description" content="${escapeHtml(description)}"/>
  <meta property="og:url" content="${escapeHtml(pageUrl)}"/>
  ${image ? `<meta property="og:image" content="${escapeHtml(image)}"/>` : ''}
  <meta name="twitter:card" content="summary_large_image"/>
  <meta name="twitter:title" content="${escapeHtml(title)}"/>
  <meta name="twitter:description" content="${escapeHtml(description)}"/>
  ${image ? `<meta name="twitter:image" content="${escapeHtml(image)}"/>` : ''}
  <meta http-equiv="refresh" content="0;url=${escapeHtml(pageUrl)}"/>
</head>
<body><p><a href="${escapeHtml(pageUrl)}">${escapeHtml(title)}</a></p></body>
</html>`;

    return new NextResponse(html, {
      headers: { 'content-type': 'text/html; charset=utf-8' },
    });
  } catch {
    return NextResponse.next();
  }
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

export const config = {
  matcher: ['/article/:path*'],
};
