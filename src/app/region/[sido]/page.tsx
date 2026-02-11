import type { Metadata } from 'next';
import Link from 'next/link';
import { BASE_URL } from '@/lib/urls';
import JsonLd from '@/components/JsonLd';
import {
  getRegions,
  slugToSido,
  sidoToSlug,
  sigunguToSlug,
  getParkingBySido,
  getParkingTypeStats,
  getFreeParkingLots,
} from '@/lib/parking-data';

interface PageProps {
  params: Promise<{ sido: string }>;
}

export async function generateStaticParams() {
  const regions = getRegions();
  return regions.map((r) => ({ sido: sidoToSlug(r.sido) }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { sido: sidoSlug } = await params;
  const sido = slugToSido(sidoSlug);
  return {
    title: `${sido} 주차장 - 공영·민영 주차장 검색, 요금 비교`,
    description: `${sido} 지역 주차장 위치, 운영시간, 요금 정보를 시군구별로 확인하세요. 공영·민영, 무료, 24시간 주차장 검색.`,
    alternates: { canonical: `${BASE_URL}/region/${sidoSlug}` },
    openGraph: {
      title: `${sido} 주차장 - 공영·민영 주차장 검색`,
      description: `${sido} 지역 주차장 위치, 운영시간, 요금 정보를 확인하세요.`,
      url: `${BASE_URL}/region/${sidoSlug}`,
    },
  };
}

export default async function SidoPage({ params }: PageProps) {
  const { sido: sidoSlug } = await params;
  const sido = slugToSido(sidoSlug);
  const regions = getRegions();
  const region = regions.find((r) => r.sido === sido);

  if (!region) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-10 text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">지역을 찾을 수 없습니다</h1>
        <Link href="/" className="text-indigo-600 hover:underline">홈으로 돌아가기</Link>
      </div>
    );
  }

  const lots = getParkingBySido(sido);
  const typeStats = getParkingTypeStats(lots);
  const freeCount = lots.filter((l) => l.isFree).length;

  return (
    <>
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'WebPage',
          name: `${sido} 주차장`,
          description: `${sido} 지역 주차장 위치, 운영시간, 요금 정보`,
          url: `${BASE_URL}/region/${sidoSlug}`,
        }}
      />

      <div className="max-w-4xl mx-auto px-4 py-10">
        {/* 브레드크럼 */}
        <nav className="text-sm text-gray-500 mb-6">
          <Link href="/" className="hover:text-indigo-600">홈</Link>
          <span className="mx-2">›</span>
          <span className="text-gray-900">{sido} 주차장</span>
        </nav>

        <h1 className="text-3xl font-extrabold text-gray-900 mb-4">
          {sido} 주차장
        </h1>
        <p className="text-lg text-gray-600 mb-10">
          {sido} 지역 {lots.length.toLocaleString()}개 주차장의 위치, 운영시간, 요금 정보를 시군구별로 확인하세요.
        </p>

        {/* 요약 통계 */}
        <section className="mb-12">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-indigo-500 to-violet-600 rounded-2xl p-5 text-white text-center">
              <div className="text-3xl font-extrabold">{lots.length.toLocaleString()}</div>
              <div className="text-sm text-indigo-100 mt-1">전체 주차장</div>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 p-5 text-center">
              <div className="text-3xl font-extrabold text-blue-600">{typeStats.공영.toLocaleString()}</div>
              <div className="text-sm text-gray-500 mt-1">공영</div>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 p-5 text-center">
              <div className="text-3xl font-extrabold text-orange-600">{typeStats.민영.toLocaleString()}</div>
              <div className="text-sm text-gray-500 mt-1">민영</div>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 p-5 text-center">
              <div className="text-3xl font-extrabold text-green-600">{freeCount.toLocaleString()}</div>
              <div className="text-sm text-gray-500 mt-1">무료</div>
            </div>
          </div>
        </section>

        {/* 시군구 목록 */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">시군구별 주차장</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {region.sigungu.map((sg) => (
              <Link
                key={sg.code}
                href={`/region/${sidoSlug}/${sigunguToSlug(sg.name)}`}
                className="bg-white rounded-2xl border border-gray-100 p-6 hover:shadow-lg hover:border-indigo-200 transition-all"
              >
                <h3 className="text-lg font-bold text-gray-900 mb-2">{sg.name}</h3>
                <p className="text-sm text-gray-600">
                  주차장 <span className="font-semibold text-indigo-600">{sg.parkingCount.toLocaleString()}개</span>
                </p>
              </Link>
            ))}
          </div>
        </section>

        {/* 관련 링크 */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">관련 페이지</h2>
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

        {/* 연관 서비스 크로스링크 */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">{sido} 연관 서비스</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <a
              href="https://car.mustarddata.com"
              className="group bg-amber-50 rounded-2xl border border-amber-100 p-5 hover:shadow-lg hover:border-amber-200 transition-all text-center"
            >
              <div className="text-3xl mb-2">🚗</div>
              <div className="font-semibold text-gray-900 group-hover:text-amber-600 transition-colors">자동차세 계산기</div>
              <p className="text-xs text-gray-500 mt-1">자동차세, 취등록세, 유류비 계산</p>
            </a>
            <a
              href={`https://hospital.mustarddata.com/region/${sidoSlug}`}
              className="group bg-blue-50 rounded-2xl border border-blue-100 p-5 hover:shadow-lg hover:border-blue-200 transition-all text-center"
            >
              <div className="text-3xl mb-2">🏥</div>
              <div className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">{sido} 병원 찾기</div>
              <p className="text-xs text-gray-500 mt-1">주차장 근처 병원 정보</p>
            </a>
            <a
              href="https://car.mustarddata.com/ev-charger"
              className="group bg-green-50 rounded-2xl border border-green-100 p-5 hover:shadow-lg hover:border-green-200 transition-all text-center"
            >
              <div className="text-3xl mb-2">⚡</div>
              <div className="font-semibold text-gray-900 group-hover:text-green-600 transition-colors">전기차 충전소</div>
              <p className="text-xs text-gray-500 mt-1">전국 전기차 충전소 검색</p>
            </a>
          </div>
        </section>
      </div>
    </>
  );
}
