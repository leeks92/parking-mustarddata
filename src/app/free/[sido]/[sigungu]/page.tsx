import type { Metadata } from 'next';
import Link from 'next/link';
import { BASE_URL } from '@/lib/urls';
import JsonLd from '@/components/JsonLd';
import {
  getRegions,
  slugToSido,
  sidoToSlug,
  slugToSigungu,
  sigunguToSlug,
  getFreeParkingBySigungu,
  is24Hours,
} from '@/lib/parking-data';

interface PageProps {
  params: Promise<{ sido: string; sigungu: string }>;
}

export async function generateStaticParams() {
  const regions = getRegions();
  const params: { sido: string; sigungu: string }[] = [];
  for (const region of regions) {
    for (const sg of region.sigungu) {
      params.push({
        sido: sidoToSlug(region.sido),
        sigungu: sigunguToSlug(sg.name),
      });
    }
  }
  return params;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { sido: sidoSlug, sigungu: sigunguSlug } = await params;
  const sido = slugToSido(sidoSlug);
  const sigungu = slugToSigungu(sigunguSlug);
  return {
    title: `${sido} ${sigungu} 무료 주차장`,
    description: `${sido} ${sigungu} 무료 주차장 위치와 운영시간을 확인하세요.`,
    alternates: { canonical: `${BASE_URL}/free/${sidoSlug}/${sigunguSlug}` },
    openGraph: {
      title: `${sido} ${sigungu} 무료 주차장`,
      description: `${sido} ${sigungu} 무료 주차장 정보`,
      url: `${BASE_URL}/free/${sidoSlug}/${sigunguSlug}`,
    },
  };
}

export default async function FreeSigunguPage({ params }: PageProps) {
  const { sido: sidoSlug, sigungu: sigunguSlug } = await params;
  const sido = slugToSido(sidoSlug);
  const sigungu = slugToSigungu(sigunguSlug);
  const freeLots = getFreeParkingBySigungu(sido, sigungu);

  return (
    <>
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'ItemList',
          name: `${sido} ${sigungu} 무료 주차장`,
          description: `${sido} ${sigungu} 무료 주차장 목록`,
          url: `${BASE_URL}/free/${sidoSlug}/${sigunguSlug}`,
          numberOfItems: freeLots.length,
        }}
      />

      <div className="max-w-4xl mx-auto px-4 py-10">
        <nav className="text-sm text-gray-500 mb-6">
          <Link href="/" className="hover:text-indigo-600">홈</Link>
          <span className="mx-2">›</span>
          <Link href="/free" className="hover:text-indigo-600">무료 주차장</Link>
          <span className="mx-2">›</span>
          <span className="text-gray-900">{sido} {sigungu}</span>
        </nav>

        <h1 className="text-3xl font-extrabold text-gray-900 mb-4">
          {sido} {sigungu} 무료 주차장
        </h1>
        <p className="text-lg text-gray-600 mb-10">
          {sido} {sigungu} 지역 무료 주차장 {freeLots.length.toLocaleString()}개입니다.
        </p>

        {freeLots.length > 0 ? (
          <div className="space-y-4 mb-12">
            {freeLots.map((lot) => (
              <Link
                key={lot.id}
                href={`/parking/${lot.id}`}
                className="block bg-white rounded-2xl border border-gray-100 p-6 hover:shadow-lg hover:border-green-200 transition-all"
              >
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-lg font-bold text-gray-900">{lot.name}</h3>
                  <span className="px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700">무료</span>
                  {is24Hours(lot) && (
                    <span className="px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-700">24시간</span>
                  )}
                </div>
                <p className="text-sm text-gray-500 mb-3">{lot.address}</p>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-400">주차면</span>
                    <p className="font-semibold text-gray-900">{lot.capacity.toLocaleString()}면</p>
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
        ) : (
          <div className="text-center py-12 text-gray-500 mb-12">
            <p>해당 지역에 등록된 무료 주차장이 없습니다.</p>
          </div>
        )}

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-4">관련 페이지</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Link
              href={`/region/${sidoSlug}/${sigunguSlug}`}
              className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-lg hover:border-indigo-200 transition-all text-center"
            >
              <div className="text-3xl mb-2">🅿️</div>
              <div className="font-semibold text-gray-900">{sigungu} 전체 주차장</div>
            </Link>
            <Link
              href="/free"
              className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-lg hover:border-indigo-200 transition-all text-center"
            >
              <div className="text-3xl mb-2">🆓</div>
              <div className="font-semibold text-gray-900">전국 무료 주차장</div>
            </Link>
          </div>
        </section>
      </div>
    </>
  );
}
