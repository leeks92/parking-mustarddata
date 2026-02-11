import type { Metadata } from 'next';
import Link from 'next/link';
import { BASE_URL } from '@/lib/urls';
import JsonLd from '@/components/JsonLd';
import { getAllLandmarks } from '@/lib/parking-data';

export const metadata: Metadata = {
  title: '주차장 블로그 - 주차 요금 비교, 무료 주차장 꿀팁',
  description:
    '강남역, 서울역, 코엑스, 해운대 등 주요 장소별 주차 요금 비교와 무료 주차장 꿀팁을 확인하세요.',
  alternates: { canonical: `${BASE_URL}/blog` },
  openGraph: {
    title: '주차장 블로그',
    description: '주요 장소별 주차 요금 비교와 무료 주차장 꿀팁',
    url: `${BASE_URL}/blog`,
  },
};

export default function BlogIndexPage() {
  const landmarks = getAllLandmarks();

  return (
    <>
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'Blog',
          name: '주차장 블로그',
          description: '주요 장소별 주차 요금 비교와 무료 주차장 꿀팁',
          url: `${BASE_URL}/blog`,
        }}
      />

      <div className="max-w-4xl mx-auto px-4 py-10">
        <nav className="text-sm text-gray-500 mb-6">
          <Link href="/" className="hover:text-indigo-600">
            홈
          </Link>
          <span className="mx-2">›</span>
          <span className="text-gray-900">블로그</span>
        </nav>

        <h1 className="text-3xl font-extrabold text-gray-900 mb-4">
          주차장 블로그
        </h1>
        <p className="text-lg text-gray-600 mb-10">
          주요 장소별 주차 요금 비교, 무료·공영 주차장 꿀팁을 정리했습니다.
        </p>

        <div className="space-y-6">
          {landmarks.map((lm) => {
            const slug = `parking-near-${lm.landmark.slug}`;
            return (
              <Link
                key={slug}
                href={`/blog/${slug}`}
                className="block bg-white rounded-2xl border border-gray-100 p-6 hover:shadow-lg hover:border-indigo-200 transition-all"
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-2 py-0.5 rounded text-xs font-medium bg-indigo-100 text-indigo-700">
                    {lm.landmark.category}
                  </span>
                  <span className="text-xs text-gray-400">2026.02.11</span>
                </div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">
                  {lm.landmark.name} 근처 주차장 요금 비교 — 무료·공영 주차장
                  총정리
                </h2>
                <p className="text-sm text-gray-600">
                  {lm.landmark.name} 근처 주차장 {lm.total}곳의 요금과 위치를
                  비교합니다. 무료 주차장 {lm.free}곳, 공영 주차장 {lm.public}
                  곳의 운영시간과 요금 정보를 한눈에 확인하세요.
                </p>
              </Link>
            );
          })}
        </div>
      </div>
    </>
  );
}
