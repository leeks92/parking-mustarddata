import type { Metadata } from 'next';
import Link from 'next/link';
import { BASE_URL } from '@/lib/urls';
import JsonLd from '@/components/JsonLd';
import { getAllLandmarks } from '@/lib/parking-data';

export const metadata: Metadata = {
  title: '주요 장소 근처 주차장 - 역세권·병원·랜드마크 주차 정보',
  description:
    '강남역, 서울역, 홍대, 코엑스, 해운대 등 주요 장소 근처 공영주차장, 무료주차장 위치와 요금을 확인하세요.',
  keywords: [
    '근처 주차장',
    '역 근처 주차장',
    '병원 근처 주차장',
    '무료 주차장',
    '공영 주차장',
  ],
  alternates: { canonical: `${BASE_URL}/near` },
  openGraph: {
    title: '주요 장소 근처 주차장',
    description:
      '주요 장소 근처 공영주차장, 무료주차장 위치와 요금 정보',
    url: `${BASE_URL}/near`,
  },
};

export default function NearIndexPage() {
  const landmarks = getAllLandmarks();

  const categories = new Map<string, typeof landmarks>();
  for (const lm of landmarks) {
    const cat = lm.landmark.category;
    if (!categories.has(cat)) categories.set(cat, []);
    categories.get(cat)!.push(lm);
  }

  return (
    <>
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'WebPage',
          name: '주요 장소 근처 주차장',
          description: '주요 장소 근처 공영주차장, 무료주차장 정보',
          url: `${BASE_URL}/near`,
        }}
      />

      <div className="max-w-4xl mx-auto px-4 py-10">
        <nav className="text-sm text-gray-500 mb-6">
          <Link href="/" className="hover:text-indigo-600">
            홈
          </Link>
          <span className="mx-2">›</span>
          <span className="text-gray-900">근처 주차장</span>
        </nav>

        <h1 className="text-3xl font-extrabold text-gray-900 mb-4">
          주요 장소 근처 주차장
        </h1>
        <p className="text-lg text-gray-600 mb-10">
          역, 병원, 관광지 등 주요 장소 근처 주차장 {landmarks.length}곳의
          공영·무료 주차 정보를 확인하세요.
        </p>

        {Array.from(categories.entries()).map(([category, items]) => (
          <section key={category} className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              {category}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {items.map((lm) => (
                <Link
                  key={lm.landmark.slug}
                  href={`/near/${lm.landmark.slug}`}
                  className="bg-white rounded-2xl border border-gray-100 p-6 hover:shadow-lg hover:border-indigo-200 transition-all"
                >
                  <h3 className="text-lg font-bold text-gray-900 mb-2">
                    {lm.landmark.name}
                  </h3>
                  <p className="text-sm text-gray-500 mb-3">
                    {lm.landmark.description}
                  </p>
                  <div className="flex gap-4 text-sm">
                    <div>
                      <span className="text-gray-400">주차장</span>
                      <p className="font-semibold text-indigo-600">
                        {lm.total.toLocaleString()}개
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-400">무료</span>
                      <p className="font-semibold text-green-600">
                        {lm.free.toLocaleString()}개
                      </p>
                    </div>
                    {lm.avgBaseFee > 0 && (
                      <div>
                        <span className="text-gray-400">평균기본</span>
                        <p className="font-semibold text-gray-900">
                          {Math.round(lm.avgBaseFee).toLocaleString()}원
                        </p>
                      </div>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </section>
        ))}

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-4">관련 페이지</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Link
              href="/free"
              className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-lg hover:border-indigo-200 transition-all text-center"
            >
              <div className="text-3xl mb-2">🆓</div>
              <div className="font-semibold text-gray-900">무료 주차장</div>
            </Link>
            <Link
              href="/compare"
              className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-lg hover:border-indigo-200 transition-all text-center"
            >
              <div className="text-3xl mb-2">💰</div>
              <div className="font-semibold text-gray-900">요금 비교</div>
            </Link>
            <Link
              href="/"
              className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-lg hover:border-indigo-200 transition-all text-center"
            >
              <div className="text-3xl mb-2">🏠</div>
              <div className="font-semibold text-gray-900">전국 주차장</div>
            </Link>
          </div>
        </section>
      </div>
    </>
  );
}
