import type { Metadata, Viewport } from 'next';
import Script from 'next/script';
import './globals.css';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ScrollToTop from '@/components/ScrollToTop';

const BASE_URL = 'https://parking.mustarddata.com';
const GA_ID = 'G-PLACEHOLDER';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#4f46e5',
};

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: '주차장 정보 - 전국 주차장 검색, 요금 비교',
    template: '%s | 주차장 정보',
  },
  description:
    '전국 주차장 위치, 운영시간, 요금 정보를 한눈에 비교하세요. 공영·민영 주차장, 무료 주차장, 24시간 주차장까지 지역별로 검색할 수 있습니다.',
  keywords: [
    '주차장',
    '주차장 찾기',
    '공영주차장',
    '무료 주차장',
    '주차 요금',
    '주차 요금 비교',
    '주차장 검색',
    '24시간 주차장',
    '월정기 주차',
    '주차장 위치',
    '주차 정보',
  ],
  alternates: {
    canonical: BASE_URL,
  },
  openGraph: {
    title: '주차장 정보 - 전국 주차장 검색, 요금 비교',
    description:
      '전국 주차장 위치, 운영시간, 요금 정보를 한눈에 비교하세요.',
    type: 'website',
    locale: 'ko_KR',
    url: BASE_URL,
    siteName: '주차장 정보',
  },
  twitter: {
    card: 'summary_large_image',
    title: '주차장 정보',
    description: '전국 주차장 검색, 요금 비교, 무료 주차장 찾기',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  category: '교통',
  creator: 'MustardData',
  publisher: 'MustardData',
  other: {
    'naver-site-verification': 'PLACEHOLDER',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="google-adsense-account" content="ca-pub-3224638013189545" />
        <meta name="naver-site-verification" content="PLACEHOLDER" />
        <meta name="NaverBot" content="All" />
        <meta name="NaverBot" content="index,follow" />
        <meta name="Yeti" content="All" />
        <meta name="Yeti" content="index,follow" />
        <meta name="daumsa" content="index,follow" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="주차장 정보" />
        <link rel="preconnect" href="https://www.googletagmanager.com" />
        <link rel="preconnect" href="https://www.google-analytics.com" />
        <link
          rel="stylesheet"
          as="style"
          crossOrigin="anonymous"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css"
        />
      </head>
      <body className="min-h-screen flex flex-col">
        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${GA_ID}');
          `}
        </Script>
        <Script
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-3224638013189545"
          crossOrigin="anonymous"
          strategy="afterInteractive"
        />
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
        <ScrollToTop />
      </body>
    </html>
  );
}
