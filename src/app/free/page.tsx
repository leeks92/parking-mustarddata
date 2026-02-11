import type { Metadata } from 'next';
import Link from 'next/link';
import { BASE_URL } from '@/lib/urls';
import JsonLd from '@/components/JsonLd';
import {
  getRegions,
  getFreeParkingLots,
  sidoToSlug,
  sigunguToSlug,
  is24Hours,
} from '@/lib/parking-data';

export const metadata: Metadata = {
  title: '무료 주차장 - 전국 무료 주차장 검색',
  description:
    '전국 무료 주차장 위치, 운영시간 정보를 지역별로 확인하세요. 공원, 체육시설, 관공서 등 무료 주차 가능한 곳을 찾아보세요.',
  keywords: ['무료 주차장', '무료 주차', '공영 무료 주차장', '무료 주차장 찾기'],
  alternates: { canonical: `${BASE_URL}/free` },
  openGraph: {
    title: '무료 주차장 - 전국 무료 주차장 검색',
    description: '전국 무료 주차장 위치, 운영시간 정보를 지역별로 확인하세요.',
    url: `${BASE_URL}/free`,
  },
};

export default function FreeParkingPage() {
  const freeLots = getFreeParkingLots();
  const regions = getRegions();

  // 시도별 무료 주차장 수
  const freeByRegion = regions.map((r) => ({
    ...r,
    freeCount: freeLots.filter((l) => l.sido === r.sido).length,
  })).filter((r) => r.freeCount > 0);

  return (
    <>
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'WebPage',
          name: '전국 무료 주차장',
          description: '전국 무료 주차장 위치, 운영시간 정보',
          url: `${BASE_URL}/free`,
        }}
      />

      <div className="max-w-4xl mx-auto px-4 py-10">
        <nav className="text-sm text-gray-500 mb-6">
          <Link href="/" className="hover:text-indigo-600">홈</Link>
          <span className="mx-2">›</span>
          <span className="text-gray-900">무료 주차장</span>
        </nav>

        <h1 className="text-3xl font-extrabold text-gray-900 mb-4">
          전국 무료 주차장
        </h1>
        <p className="text-lg text-gray-600 mb-10">
          전국 {freeLots.length}개 무료 주차장의 위치와 운영시간을 확인하세요.
        </p>

        {/* 지역별 무료 주차장 */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">지역별 무료 주차장</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {freeByRegion.map((r) => (
              <Link
                key={r.sidoCode}
                href={`/region/${sidoToSlug(r.sido)}`}
                className="bg-green-50 rounded-2xl border border-green-100 p-6 hover:shadow-lg hover:border-green-200 transition-all"
              >
                <h3 className="text-lg font-bold text-gray-900 mb-2">{r.sido}</h3>
                <p className="text-sm text-gray-600">
                  무료 주차장 <span className="font-semibold text-green-700">{r.freeCount}개</span>
                </p>
              </Link>
            ))}
          </div>
        </section>

        {/* 전체 무료 주차장 목록 */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">무료 주차장 목록</h2>
          <div className="space-y-4">
            {freeLots.map((lot) => (
              <Link
                key={lot.id}
                href={`/parking/${lot.id}`}
                className="block bg-white rounded-2xl border border-gray-100 p-6 hover:shadow-lg hover:border-green-200 transition-all"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-lg font-bold text-gray-900">{lot.name}</h3>
                      <span className="px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700">
                        무료
                      </span>
                      {is24Hours(lot) && (
                        <span className="px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-700">
                          24시간
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500">{lot.address}</p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4 mt-3 text-sm">
                  <div>
                    <span className="text-gray-400">지역</span>
                    <p className="font-semibold text-gray-900">{lot.sido} {lot.sigungu}</p>
                  </div>
                  <div>
                    <span className="text-gray-400">주차면</span>
                    <p className="font-semibold text-gray-900">{lot.capacity}면</p>
                  </div>
                  <div>
                    <span className="text-gray-400">운영시간</span>
                    <p className="font-semibold text-gray-900">
                      {is24Hours(lot) ? '24시간' : `${lot.weekdayOpen}~${lot.weekdayClose}`}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* 관련 페이지 */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">관련 페이지</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
