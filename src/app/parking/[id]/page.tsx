import type { Metadata } from 'next';
import Link from 'next/link';
import { BASE_URL } from '@/lib/urls';
import JsonLd from '@/components/JsonLd';
import {
  getAllParkingIds,
  getParkingLotById,
  getNearbyParkingLots,
  is24Hours,
  calculateFee,
  sidoToSlug,
  sigunguToSlug,
} from '@/lib/parking-data';
import FeeCalculator from './FeeCalculator';

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateStaticParams() {
  return getAllParkingIds().map((id) => ({ id }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const lot = getParkingLotById(id);
  if (!lot) return { title: '주차장을 찾을 수 없습니다' };

  const feeInfo = lot.isFree ? '무료' : `기본 ${lot.baseFee.toLocaleString()}원/${lot.baseTime}분`;
  return {
    title: `${lot.name} - ${lot.sido} ${lot.sigungu} ${lot.parkingType}주차장`,
    description: `${lot.name} 주차장 정보. ${lot.address}. ${feeInfo}. 주차면 ${lot.capacity}면. 운영시간, 요금, 위치 정보를 확인하세요.`,
    alternates: { canonical: `${BASE_URL}/parking/${id}` },
    openGraph: {
      title: `${lot.name} - ${lot.parkingType}주차장`,
      description: `${lot.address}. ${feeInfo}. 주차면 ${lot.capacity}면.`,
      url: `${BASE_URL}/parking/${id}`,
    },
  };
}

export default async function ParkingDetailPage({ params }: PageProps) {
  const { id } = await params;
  const lot = getParkingLotById(id);

  if (!lot) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-10 text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">주차장을 찾을 수 없습니다</h1>
        <Link href="/" className="text-indigo-600 hover:underline">홈으로 돌아가기</Link>
      </div>
    );
  }

  const nearby = getNearbyParkingLots(lot, 4);
  const sidoSlug = sidoToSlug(lot.sido);
  const sigunguSlug = sigunguToSlug(lot.sigungu);

  const faqItems = [
    {
      q: `${lot.name}의 주차 요금은 얼마인가요?`,
      a: lot.isFree
        ? `${lot.name}은(는) 무료 주차장입니다.`
        : `기본 ${lot.baseTime}분 ${lot.baseFee.toLocaleString()}원이며, 추가 ${lot.addTime}분당 ${lot.addFee.toLocaleString()}원이 부과됩니다.${lot.dailyMax > 0 ? ` 일 최대 요금은 ${lot.dailyMax.toLocaleString()}원입니다.` : ''}`,
    },
    {
      q: `${lot.name}의 운영시간은 어떻게 되나요?`,
      a: is24Hours(lot)
        ? `${lot.name}은(는) 24시간 운영됩니다.`
        : `평일 ${lot.weekdayOpen}~${lot.weekdayClose}, 토요일 ${lot.satOpen}~${lot.satClose}, 일요일/공휴일 ${lot.sunOpen}~${lot.sunClose}에 운영됩니다.`,
    },
    {
      q: `${lot.name}의 주차 가능 대수는?`,
      a: `총 ${lot.capacity}면의 주차 공간이 있습니다.`,
    },
  ];

  return (
    <>
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'ParkingFacility',
          name: lot.name,
          address: {
            '@type': 'PostalAddress',
            streetAddress: lot.address,
            addressLocality: lot.sigungu,
            addressRegion: lot.sido,
            addressCountry: 'KR',
          },
          telephone: lot.phone,
          geo: {
            '@type': 'GeoCoordinates',
            latitude: lot.lat,
            longitude: lot.lng,
          },
          openingHours: is24Hours(lot) ? 'Mo-Su 00:00-23:59' : `Mo-Fr ${lot.weekdayOpen}-${lot.weekdayClose}`,
          url: `${BASE_URL}/parking/${lot.id}`,
        }}
      />
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'FAQPage',
          mainEntity: faqItems.map((item) => ({
            '@type': 'Question',
            name: item.q,
            acceptedAnswer: { '@type': 'Answer', text: item.a },
          })),
        }}
      />

      <div className="max-w-4xl mx-auto px-4 py-10">
        {/* 브레드크럼 */}
        <nav className="text-sm text-gray-500 mb-6">
          <Link href="/" className="hover:text-indigo-600">홈</Link>
          <span className="mx-2">›</span>
          <Link href={`/region/${sidoSlug}`} className="hover:text-indigo-600">{lot.sido}</Link>
          <span className="mx-2">›</span>
          <Link href={`/region/${sidoSlug}/${sigunguSlug}`} className="hover:text-indigo-600">{lot.sigungu}</Link>
          <span className="mx-2">›</span>
          <span className="text-gray-900">{lot.name}</span>
        </nav>

        {/* 헤더 */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <h1 className="text-3xl font-extrabold text-gray-900">{lot.name}</h1>
          </div>
          <div className="flex flex-wrap gap-2 mb-3">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
              lot.parkingType === '공영' ? 'bg-blue-100 text-blue-700' :
              lot.parkingType === '민영' ? 'bg-orange-100 text-orange-700' :
              lot.parkingType === '노외' ? 'bg-purple-100 text-purple-700' :
              'bg-gray-100 text-gray-700'
            }`}>
              {lot.parkingType}
            </span>
            <span className="px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-700">
              {lot.operationType}
            </span>
            {lot.isFree && (
              <span className="px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-700">
                무료
              </span>
            )}
            {is24Hours(lot) && (
              <span className="px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-700">
                24시간
              </span>
            )}
          </div>
          <p className="text-gray-600">{lot.address}</p>
          {lot.phone && <p className="text-gray-500 text-sm mt-1">전화: {lot.phone}</p>}
        </div>

        {/* 운영시간 */}
        <section className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">운영시간</h2>
          <div className="overflow-x-auto">
            <table className="w-full bg-white rounded-2xl overflow-hidden border border-gray-100">
              <thead>
                <tr className="bg-indigo-50">
                  <th className="text-left px-5 py-3 text-sm font-semibold text-gray-900">구분</th>
                  <th className="text-right px-5 py-3 text-sm font-semibold text-gray-900">시작</th>
                  <th className="text-right px-5 py-3 text-sm font-semibold text-gray-900">종료</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-t border-gray-100">
                  <td className="px-5 py-3 text-sm text-gray-900">평일</td>
                  <td className="px-5 py-3 text-sm text-right text-gray-900">{lot.weekdayOpen}</td>
                  <td className="px-5 py-3 text-sm text-right text-gray-900">{lot.weekdayClose}</td>
                </tr>
                <tr className="border-t border-gray-100">
                  <td className="px-5 py-3 text-sm text-gray-900">토요일</td>
                  <td className="px-5 py-3 text-sm text-right text-gray-900">{lot.satOpen}</td>
                  <td className="px-5 py-3 text-sm text-right text-gray-900">{lot.satClose}</td>
                </tr>
                <tr className="border-t border-gray-100">
                  <td className="px-5 py-3 text-sm text-gray-900">일요일/공휴일</td>
                  <td className="px-5 py-3 text-sm text-right text-gray-900">{lot.sunOpen}</td>
                  <td className="px-5 py-3 text-sm text-right text-gray-900">{lot.sunClose}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* 요금 정보 */}
        <section className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">요금 정보</h2>
          {lot.isFree ? (
            <div className="bg-green-50 rounded-2xl p-6 border border-green-100 text-center">
              <p className="text-2xl font-bold text-green-700">무료 주차장</p>
              <p className="text-sm text-green-600 mt-2">주차 요금이 부과되지 않습니다</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full bg-white rounded-2xl overflow-hidden border border-gray-100">
                <thead>
                  <tr className="bg-indigo-50">
                    <th className="text-left px-5 py-3 text-sm font-semibold text-gray-900">항목</th>
                    <th className="text-right px-5 py-3 text-sm font-semibold text-gray-900">금액</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-t border-gray-100">
                    <td className="px-5 py-3 text-sm text-gray-900">기본 요금 ({lot.baseTime}분)</td>
                    <td className="px-5 py-3 text-sm text-right font-semibold text-gray-900">
                      {lot.baseFee.toLocaleString()}원
                    </td>
                  </tr>
                  <tr className="border-t border-gray-100">
                    <td className="px-5 py-3 text-sm text-gray-900">추가 요금 ({lot.addTime}분당)</td>
                    <td className="px-5 py-3 text-sm text-right font-semibold text-gray-900">
                      {lot.addFee.toLocaleString()}원
                    </td>
                  </tr>
                  {lot.dailyMax > 0 && (
                    <tr className="border-t border-gray-100">
                      <td className="px-5 py-3 text-sm text-gray-900">일 최대 요금</td>
                      <td className="px-5 py-3 text-sm text-right font-semibold text-indigo-600">
                        {lot.dailyMax.toLocaleString()}원
                      </td>
                    </tr>
                  )}
                  {lot.monthlyFee > 0 && (
                    <tr className="border-t border-gray-100">
                      <td className="px-5 py-3 text-sm text-gray-900">월정기 요금</td>
                      <td className="px-5 py-3 text-sm text-right font-semibold text-indigo-600">
                        {lot.monthlyFee.toLocaleString()}원
                      </td>
                    </tr>
                  )}
                  <tr className="border-t border-gray-100 bg-gray-50">
                    <td className="px-5 py-3 text-sm text-gray-900">1시간 주차 시</td>
                    <td className="px-5 py-3 text-sm text-right font-bold text-indigo-600">
                      {calculateFee(lot, 60).toLocaleString()}원
                    </td>
                  </tr>
                  <tr className="border-t border-gray-100 bg-gray-50">
                    <td className="px-5 py-3 text-sm text-gray-900">3시간 주차 시</td>
                    <td className="px-5 py-3 text-sm text-right font-bold text-indigo-600">
                      {calculateFee(lot, 180).toLocaleString()}원
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* 요금 계산기 */}
        <section className="mb-8">
          <FeeCalculator lot={lot} />
        </section>

        {/* 기본 정보 */}
        <section className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">기본 정보</h2>
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-400">주차 유형</span>
                <p className="font-semibold text-gray-900">{lot.parkingType}</p>
              </div>
              <div>
                <span className="text-gray-400">운영 방식</span>
                <p className="font-semibold text-gray-900">{lot.operationType}</p>
              </div>
              <div>
                <span className="text-gray-400">주차 가능 대수</span>
                <p className="font-semibold text-gray-900">{lot.capacity}면</p>
              </div>
              <div>
                <span className="text-gray-400">전화번호</span>
                <p className="font-semibold text-gray-900">{lot.phone || '-'}</p>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">자주 묻는 질문</h2>
          <div className="space-y-4">
            {faqItems.map((item, i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-100 p-6">
                <h3 className="font-semibold text-gray-900 mb-2 flex items-start gap-2">
                  <span className="text-indigo-500 font-bold shrink-0">Q.</span>
                  {item.q}
                </h3>
                <p className="text-gray-600 leading-relaxed pl-6">
                  <span className="text-gray-400 font-bold">A.</span> {item.a}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* 연관 서비스 크로스링크 */}
        <section className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">함께 이용하기</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <a
              href="https://car.mustarddata.com"
              className="group bg-amber-50 rounded-2xl border border-amber-100 p-5 hover:shadow-lg hover:border-amber-200 transition-all"
            >
              <div className="text-2xl mb-2">🚗</div>
              <h3 className="font-bold text-gray-900 mb-1 group-hover:text-amber-600 transition-colors">
                자동차세 계산기
              </h3>
              <p className="text-sm text-gray-600">
                내 차 자동차세, 취등록세, 유류비를 계산해보세요
              </p>
            </a>
            <a
              href={`https://hospital.mustarddata.com/region/${sidoSlug}`}
              className="group bg-blue-50 rounded-2xl border border-blue-100 p-5 hover:shadow-lg hover:border-blue-200 transition-all"
            >
              <div className="text-2xl mb-2">🏥</div>
              <h3 className="font-bold text-gray-900 mb-1 group-hover:text-blue-600 transition-colors">
                {lot.sido} 병원 찾기
              </h3>
              <p className="text-sm text-gray-600">
                주차장 근처 병원 정보를 확인하세요
              </p>
            </a>
            <a
              href="https://car.mustarddata.com/ev-charger"
              className="group bg-green-50 rounded-2xl border border-green-100 p-5 hover:shadow-lg hover:border-green-200 transition-all"
            >
              <div className="text-2xl mb-2">⚡</div>
              <h3 className="font-bold text-gray-900 mb-1 group-hover:text-green-600 transition-colors">
                전기차 충전소
              </h3>
              <p className="text-sm text-gray-600">
                전국 전기차 충전소 위치를 검색하세요
              </p>
            </a>
          </div>
        </section>

        {/* 근처 주차장 */}
        {nearby.length > 0 && (
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4">주변 주차장</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {nearby.map((n) => (
                <Link
                  key={n.id}
                  href={`/parking/${n.id}`}
                  className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-lg hover:border-indigo-200 transition-all"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold text-gray-900">{n.name}</h3>
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                      n.parkingType === '공영' ? 'bg-blue-100 text-blue-700' :
                      n.parkingType === '민영' ? 'bg-orange-100 text-orange-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {n.parkingType}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 mb-2">{n.address}</p>
                  <p className="text-sm font-semibold text-indigo-600">
                    {n.isFree ? '무료' : `1시간 ${calculateFee(n, 60).toLocaleString()}원`}
                  </p>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </>
  );
}
