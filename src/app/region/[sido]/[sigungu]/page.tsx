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
  getParkingBySigungu,
  is24Hours,
  calculateFee,
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
    title: `${sido} ${sigungu} 주차장 - 위치, 요금, 운영시간`,
    description: `${sido} ${sigungu} 주차장 목록입니다. 공영·민영, 무료, 24시간 주차장을 검색하고 요금을 비교하세요.`,
    alternates: { canonical: `${BASE_URL}/region/${sidoSlug}/${sigunguSlug}` },
    openGraph: {
      title: `${sido} ${sigungu} 주차장`,
      description: `${sido} ${sigungu} 주차장 위치, 요금, 운영시간 정보`,
      url: `${BASE_URL}/region/${sidoSlug}/${sigunguSlug}`,
    },
  };
}

export default async function SigunguPage({ params }: PageProps) {
  const { sido: sidoSlug, sigungu: sigunguSlug } = await params;
  const sido = slugToSido(sidoSlug);
  const sigungu = slugToSigungu(sigunguSlug);
  const lots = getParkingBySigungu(sido, sigungu);

  const publicLots = lots.filter((l) => l.parkingType === '공영');
  const privateLots = lots.filter((l) => l.parkingType === '민영');
  const freeLots = lots.filter((l) => l.isFree);
  const allDayLots = lots.filter((l) => is24Hours(l));

  return (
    <>
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'ItemList',
          name: `${sido} ${sigungu} 주차장`,
          description: `${sido} ${sigungu} 주차장 목록`,
          url: `${BASE_URL}/region/${sidoSlug}/${sigunguSlug}`,
          numberOfItems: lots.length,
          itemListElement: lots.map((lot, i) => ({
            '@type': 'ListItem',
            position: i + 1,
            item: {
              '@type': 'ParkingFacility',
              name: lot.name,
              address: lot.address,
              telephone: lot.phone,
            },
          })),
        }}
      />

      <div className="max-w-4xl mx-auto px-4 py-10">
        {/* 브레드크럼 */}
        <nav className="text-sm text-gray-500 mb-6">
          <Link href="/" className="hover:text-indigo-600">홈</Link>
          <span className="mx-2">›</span>
          <Link href={`/region/${sidoSlug}`} className="hover:text-indigo-600">{sido}</Link>
          <span className="mx-2">›</span>
          <span className="text-gray-900">{sigungu}</span>
        </nav>

        <h1 className="text-3xl font-extrabold text-gray-900 mb-4">
          {sido} {sigungu} 주차장
        </h1>
        <p className="text-lg text-gray-600 mb-8">
          {sido} {sigungu} 지역 {lots.length.toLocaleString()}개 주차장 정보입니다.
        </p>

        {/* 필터 요약 */}
        <div className="flex flex-wrap gap-3 mb-8">
          <span className="px-4 py-2 bg-indigo-100 text-indigo-700 rounded-full text-sm font-medium">
            전체 {lots.length.toLocaleString()}
          </span>
          {publicLots.length > 0 && (
            <span className="px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
              공영 {publicLots.length.toLocaleString()}
            </span>
          )}
          {privateLots.length > 0 && (
            <span className="px-4 py-2 bg-orange-100 text-orange-700 rounded-full text-sm font-medium">
              민영 {privateLots.length.toLocaleString()}
            </span>
          )}
          {freeLots.length > 0 && (
            <span className="px-4 py-2 bg-green-100 text-green-700 rounded-full text-sm font-medium">
              무료 {freeLots.length.toLocaleString()}
            </span>
          )}
          {allDayLots.length > 0 && (
            <span className="px-4 py-2 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">
              24시간 {allDayLots.length.toLocaleString()}
            </span>
          )}
        </div>

        {/* 주차장 목록 */}
        <section className="space-y-4 mb-12">
          {lots.map((lot) => {
            const fee1h = calculateFee(lot, 60);
            const fee3h = calculateFee(lot, 180);
            return (
              <Link
                key={lot.id}
                href={`/parking/${lot.id}`}
                className="block bg-white rounded-2xl border border-gray-100 p-6 hover:shadow-lg hover:border-indigo-200 transition-all"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-lg font-bold text-gray-900">{lot.name}</h3>
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                        lot.parkingType === '공영' ? 'bg-blue-100 text-blue-700' :
                        lot.parkingType === '민영' ? 'bg-orange-100 text-orange-700' :
                        lot.parkingType === '노외' ? 'bg-purple-100 text-purple-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {lot.parkingType}
                      </span>
                      {lot.isFree && (
                        <span className="px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700">
                          무료
                        </span>
                      )}
                      {is24Hours(lot) && (
                        <span className="px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-700">
                          24시간
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500">{lot.address}</p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-gray-400">주차면</span>
                    <p className="font-semibold text-gray-900">{lot.capacity.toLocaleString()}면</p>
                  </div>
                  <div>
                    <span className="text-gray-400">1시간</span>
                    <p className="font-semibold text-indigo-600">
                      {lot.isFree ? '무료' : `${fee1h.toLocaleString()}원`}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-400">3시간</span>
                    <p className="font-semibold text-indigo-600">
                      {lot.isFree ? '무료' : `${fee3h.toLocaleString()}원`}
                    </p>
                  </div>
                </div>
              </Link>
            );
          })}
        </section>

        {lots.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <p>해당 지역의 주차장 정보가 없습니다.</p>
          </div>
        )}
      </div>
    </>
  );
}
