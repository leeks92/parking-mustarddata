import type { Metadata } from 'next';
import Link from 'next/link';
import { BASE_URL } from '@/lib/urls';
import JsonLd from '@/components/JsonLd';
import {
  getAllLandmarkSlugs,
  getLandmarkBySlug,
  getParkingNearCoords,
  calculateFee,
  is24Hours,
} from '@/lib/parking-data';

interface PageProps {
  params: Promise<{ landmark: string }>;
}

export async function generateStaticParams() {
  return getAllLandmarkSlugs().map((slug) => ({ landmark: slug }));
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { landmark: slug } = await params;
  const data = getLandmarkBySlug(slug);
  if (!data) return { title: '장소를 찾을 수 없습니다' };

  const { name } = data.landmark;
  const title = `${name} 근처 주차장 - 무료·공영 주차장, 요금 정보`;
  const description = `${name} 근처 주차장 ${data.total}개 위치와 요금 정보. 무료 주차장 ${data.free}개, 공영 주차장 ${data.public}개. ${name} 주차 꿀팁과 저렴한 주차장을 확인하세요.`;

  return {
    title,
    description,
    keywords: [
      `${name} 근처 주차장`,
      `${name} 무료 주차장`,
      `${name} 공영 주차장`,
      `${name} 주차`,
      `${name} 주차 요금`,
      `${name} 근처 무료 주차`,
    ],
    alternates: { canonical: `${BASE_URL}/near/${slug}` },
    openGraph: {
      title: `${name} 근처 주차장`,
      description,
      url: `${BASE_URL}/near/${slug}`,
    },
  };
}

export default async function LandmarkPage({ params }: PageProps) {
  const { landmark: slug } = await params;
  const data = getLandmarkBySlug(slug);

  if (!data) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-10 text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          장소를 찾을 수 없습니다
        </h1>
        <Link href="/near" className="text-indigo-600 hover:underline">
          근처 주차장 목록으로
        </Link>
      </div>
    );
  }

  const { landmark } = data;
  const nearbyLots = getParkingNearCoords(landmark.lat, landmark.lng, 1.0, 50);
  const freeLots = nearbyLots.filter((l) => l.isFree);
  const publicLots = nearbyLots.filter((l) => l.parkingType === '공영');
  const paidLots = nearbyLots
    .filter((l) => !l.isFree && l.baseFee > 0)
    .sort((a, b) => calculateFee(a, 60) - calculateFee(b, 60));

  const jsonLdData = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: `${landmark.name} 근처 주차장`,
    description: `${landmark.name} 근처 공영주차장, 무료주차장 정보`,
    url: `${BASE_URL}/near/${slug}`,
    numberOfItems: nearbyLots.length,
  };

  return (
    <>
      <JsonLd data={jsonLdData} />

      <div className="max-w-4xl mx-auto px-4 py-10">
        <nav className="text-sm text-gray-500 mb-6">
          <Link href="/" className="hover:text-indigo-600">
            홈
          </Link>
          <span className="mx-2">›</span>
          <Link href="/near" className="hover:text-indigo-600">
            근처 주차장
          </Link>
          <span className="mx-2">›</span>
          <span className="text-gray-900">{landmark.name}</span>
        </nav>

        <h1 className="text-3xl font-extrabold text-gray-900 mb-2">
          {landmark.name} 근처 주차장
        </h1>
        <p className="text-lg text-gray-600 mb-8">
          {landmark.description} — {landmark.name} 반경 1km 내 주차장{' '}
          {nearbyLots.length.toLocaleString()}개의 위치, 요금, 운영시간
          정보입니다.
        </p>

        {/* 요약 통계 */}
        <section className="mb-10">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-indigo-500 to-violet-600 rounded-2xl p-5 text-white text-center">
              <div className="text-3xl font-extrabold">
                {nearbyLots.length.toLocaleString()}
              </div>
              <div className="text-sm text-indigo-100 mt-1">전체 주차장</div>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 p-5 text-center">
              <div className="text-3xl font-extrabold text-green-600">
                {freeLots.length.toLocaleString()}
              </div>
              <div className="text-sm text-gray-500 mt-1">무료</div>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 p-5 text-center">
              <div className="text-3xl font-extrabold text-blue-600">
                {publicLots.length.toLocaleString()}
              </div>
              <div className="text-sm text-gray-500 mt-1">공영</div>
            </div>
            {data.avgBaseFee > 0 && (
              <div className="bg-white rounded-2xl border border-gray-100 p-5 text-center">
                <div className="text-3xl font-extrabold text-orange-600">
                  {Math.round(data.avgBaseFee).toLocaleString()}
                </div>
                <div className="text-sm text-gray-500 mt-1">평균 기본요금(원)</div>
              </div>
            )}
          </div>
        </section>

        {/* 무료 주차장 */}
        {freeLots.length > 0 && (
          <section className="mb-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              {landmark.name} 근처 무료 주차장
            </h2>
            <p className="text-sm text-gray-500 mb-4">
              {landmark.name} 반경 1km 이내 무료 주차장{' '}
              {freeLots.length.toLocaleString()}개입니다.
            </p>
            <div className="space-y-4">
              {freeLots.slice(0, 10).map((lot) => (
                <Link
                  key={lot.id}
                  href={`/parking/${lot.id}`}
                  className="block bg-white rounded-2xl border border-gray-100 p-6 hover:shadow-lg hover:border-green-200 transition-all"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-lg font-bold text-gray-900">
                      {lot.name}
                    </h3>
                    <span className="px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700">
                      무료
                    </span>
                    {is24Hours(lot) && (
                      <span className="px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-700">
                        24시간
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 mb-3">{lot.address}</p>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-400">주차면</span>
                      <p className="font-semibold text-gray-900">
                        {lot.capacity.toLocaleString()}면
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-400">운영시간</span>
                      <p className="font-semibold text-gray-900">
                        {is24Hours(lot)
                          ? '24시간'
                          : `${lot.weekdayOpen}~${lot.weekdayClose}`}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
            {freeLots.length > 10 && (
              <p className="text-sm text-gray-400 mt-4 text-center">
                외 {(freeLots.length - 10).toLocaleString()}개 무료 주차장
              </p>
            )}
          </section>
        )}

        {/* 공영 주차장 */}
        {publicLots.length > 0 && (
          <section className="mb-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              {landmark.name} 근처 공영 주차장
            </h2>
            <p className="text-sm text-gray-500 mb-4">
              {landmark.name} 반경 1km 이내 공영 주차장{' '}
              {publicLots.length.toLocaleString()}개입니다.
            </p>
            <div className="space-y-4">
              {publicLots
                .filter((l) => !l.isFree)
                .slice(0, 10)
                .map((lot) => (
                  <Link
                    key={lot.id}
                    href={`/parking/${lot.id}`}
                    className="block bg-white rounded-2xl border border-gray-100 p-6 hover:shadow-lg hover:border-blue-200 transition-all"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-lg font-bold text-gray-900">
                        {lot.name}
                      </h3>
                      <span className="px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-700">
                        공영
                      </span>
                      {is24Hours(lot) && (
                        <span className="px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-700">
                          24시간
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 mb-3">{lot.address}</p>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-gray-400">주차면</span>
                        <p className="font-semibold text-gray-900">
                          {lot.capacity.toLocaleString()}면
                        </p>
                      </div>
                      <div>
                        <span className="text-gray-400">기본요금</span>
                        <p className="font-semibold text-gray-900">
                          {lot.baseFee.toLocaleString()}원/{lot.baseTime}분
                        </p>
                      </div>
                      <div>
                        <span className="text-gray-400">1시간 요금</span>
                        <p className="font-semibold text-gray-900">
                          {calculateFee(lot, 60).toLocaleString()}원
                        </p>
                      </div>
                    </div>
                  </Link>
                ))}
            </div>
          </section>
        )}

        {/* 저렴한 주차장 TOP 5 */}
        {paidLots.length > 0 && (
          <section className="mb-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              {landmark.name} 근처 저렴한 주차장 TOP 5
            </h2>
            <p className="text-sm text-gray-500 mb-4">
              1시간 기준 요금이 저렴한 순서입니다.
            </p>
            <div className="space-y-4">
              {paidLots.slice(0, 5).map((lot, idx) => (
                <Link
                  key={lot.id}
                  href={`/parking/${lot.id}`}
                  className="block bg-white rounded-2xl border border-gray-100 p-6 hover:shadow-lg hover:border-orange-200 transition-all"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="flex items-center justify-center w-7 h-7 rounded-full bg-orange-100 text-orange-700 text-sm font-bold">
                      {idx + 1}
                    </span>
                    <h3 className="text-lg font-bold text-gray-900">
                      {lot.name}
                    </h3>
                    <span
                      className={`px-2 py-0.5 rounded text-xs font-medium ${
                        lot.parkingType === '공영'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {lot.parkingType}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 mb-3">{lot.address}</p>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-gray-400">기본요금</span>
                      <p className="font-semibold text-gray-900">
                        {lot.baseFee.toLocaleString()}원/{lot.baseTime}분
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-400">1시간 요금</span>
                      <p className="font-semibold text-orange-600">
                        {calculateFee(lot, 60).toLocaleString()}원
                      </p>
                    </div>
                    {lot.dailyMax > 0 && (
                      <div>
                        <span className="text-gray-400">1일 최대</span>
                        <p className="font-semibold text-gray-900">
                          {lot.dailyMax.toLocaleString()}원
                        </p>
                      </div>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* 주차 팁 (SEO용 콘텐츠) */}
        <section className="mb-10 bg-indigo-50 rounded-2xl p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            {landmark.name} 주차 팁
          </h2>
          <ul className="space-y-2 text-sm text-gray-700">
            {freeLots.length > 0 && (
              <li>
                {landmark.name} 근처 무료 주차장이{' '}
                {freeLots.length.toLocaleString()}개 있습니다. 무료 주차장을
                이용하면 주차비를 절약할 수 있습니다.
              </li>
            )}
            {publicLots.length > 0 && (
              <li>
                공영 주차장({publicLots.length.toLocaleString()}개)은 민영보다
                요금이 저렴한 경우가 많습니다.
              </li>
            )}
            {data.avgBaseFee > 0 && (
              <li>
                평균 기본요금은 {Math.round(data.avgBaseFee).toLocaleString()}
                원이며, 추가요금은 평균{' '}
                {Math.round(data.avgAddFee).toLocaleString()}원입니다.
              </li>
            )}
            <li>
              주말과 공휴일에는 운영시간이 다를 수 있으므로, 방문 전 운영시간을
              확인하세요.
            </li>
          </ul>
        </section>

        {/* FAQ (SEO용) */}
        <section className="mb-10">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            자주 묻는 질문
          </h2>
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <h3 className="font-bold text-gray-900 mb-2">
                {landmark.name} 근처 무료 주차장이 있나요?
              </h3>
              <p className="text-sm text-gray-600">
                {freeLots.length > 0
                  ? `네, ${landmark.name} 반경 1km 내에 무료 주차장이 ${freeLots.length.toLocaleString()}개 있습니다.`
                  : `${landmark.name} 반경 1km 내에는 무료 주차장이 없습니다. 유료 주차장을 이용해주세요.`}
              </p>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <h3 className="font-bold text-gray-900 mb-2">
                {landmark.name} 근처 주차 요금은 얼마인가요?
              </h3>
              <p className="text-sm text-gray-600">
                {data.avgBaseFee > 0
                  ? `${landmark.name} 근처 유료 주차장의 평균 기본요금은 ${Math.round(data.avgBaseFee).toLocaleString()}원입니다. 가장 저렴한 주차장은 위 목록에서 확인하세요.`
                  : `${landmark.name} 근처 주차장은 대부분 무료로 운영됩니다.`}
              </p>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <h3 className="font-bold text-gray-900 mb-2">
                {landmark.name} 근처 공영 주차장은 몇 개인가요?
              </h3>
              <p className="text-sm text-gray-600">
                {landmark.name} 반경 1km 내에 공영 주차장이{' '}
                {publicLots.length.toLocaleString()}개 있습니다. 공영 주차장은
                요금이 저렴하고 관리가 잘 되어 있어 추천합니다.
              </p>
            </div>
          </div>
        </section>

        {/* 관련 페이지 */}
        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-4">관련 페이지</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Link
              href="/near"
              className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-lg hover:border-indigo-200 transition-all text-center"
            >
              <div className="text-3xl mb-2">📍</div>
              <div className="font-semibold text-gray-900">
                근처 주차장 전체
              </div>
            </Link>
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
          </div>
        </section>
      </div>
    </>
  );
}
