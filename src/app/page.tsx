import Link from 'next/link';
import JsonLd from '@/components/JsonLd';
import { BASE_URL } from '@/lib/urls';
import {
  getRegions,
  getTotalParkingCount,
  getFreeParkingLots,
  sidoToSlug,
  getParkingTypeStats,
  getAllParkingLots,
} from '@/lib/parking-data';

const faqs = [
  {
    question: '공영주차장과 민영주차장의 차이는 무엇인가요?',
    answer:
      '공영주차장은 지방자치단체가 설치·운영하는 주차장으로 요금이 저렴합니다. 민영주차장은 민간 사업자가 운영하며, 위치와 시설에 따라 요금이 다양합니다.',
  },
  {
    question: '노상주차장과 노외주차장의 차이는 무엇인가요?',
    answer:
      '노상주차장은 도로 위에 설치된 주차장으로, 도로변 주차구획이 해당됩니다. 노외주차장은 도로 외 부지에 별도로 설치된 주차장(주차빌딩, 지하주차장 등)입니다.',
  },
  {
    question: '주차 요금은 어떻게 계산되나요?',
    answer:
      '대부분의 주차장은 기본 시간(예: 30분)에 대한 기본 요금이 있고, 이후 추가 시간(예: 10분)당 추가 요금이 부과됩니다. 일 최대 요금이 설정된 경우 하루 요금이 그 이상으로 올라가지 않습니다.',
  },
  {
    question: '무료 주차장은 어디서 찾을 수 있나요?',
    answer:
      '공원, 체육시설, 관공서 등에서 무료 주차장을 운영하는 경우가 많습니다. 본 사이트의 "무료 주차장" 메뉴에서 지역별 무료 주차장 목록을 확인할 수 있습니다.',
  },
];

const features = [
  {
    icon: '📍',
    title: '지역별 검색',
    desc: '전국 시도·시군구별 주차장 검색',
  },
  {
    icon: '💰',
    title: '요금 비교',
    desc: '주차 시간 입력 후 요금 즉시 비교',
  },
  {
    icon: '🆓',
    title: '무료 주차장',
    desc: '전국 무료 주차장 한눈에 확인',
  },
  {
    icon: '📱',
    title: '모바일 최적화',
    desc: '스마트폰에서도 편하게 이용',
  },
];

export default function HomePage() {
  const regions = getRegions();
  const totalCount = getTotalParkingCount();
  const freeCount = getFreeParkingLots().length;
  const allLots = getAllParkingLots();
  const typeStats = getParkingTypeStats(allLots);

  return (
    <>
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'WebSite',
          name: '주차장 정보',
          url: BASE_URL,
          description:
            '전국 주차장 위치, 운영시간, 요금 정보를 한눈에 비교하세요.',
          publisher: {
            '@type': 'Organization',
            name: 'MustardData',
          },
        }}
      />
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'FAQPage',
          mainEntity: faqs.map((faq) => ({
            '@type': 'Question',
            name: faq.question,
            acceptedAnswer: {
              '@type': 'Answer',
              text: faq.answer,
            },
          })),
        }}
      />

      {/* Hero */}
      <section className="bg-gradient-to-br from-indigo-600 to-violet-700 text-white">
        <div className="max-w-6xl mx-auto px-4 py-16 md:py-20 text-center">
          <h1 className="text-3xl md:text-5xl font-extrabold mb-4 leading-tight">
            전국 주차장 검색,
            <br className="md:hidden" /> 요금 비교
          </h1>
          <p className="text-lg md:text-xl text-indigo-100 mb-8 max-w-2xl mx-auto">
            공영·민영 주차장, 무료 주차장, 24시간 주차장까지.
            <br />
            지역별 주차장 정보와 요금을 한눈에 비교하세요.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link
              href="/region/seoul"
              className="px-6 py-3 bg-white text-indigo-700 font-semibold rounded-xl hover:bg-indigo-50 transition-colors"
            >
              서울 주차장 찾기
            </Link>
            <Link
              href="/compare"
              className="px-6 py-3 bg-indigo-500 text-white font-semibold rounded-xl hover:bg-indigo-400 transition-colors"
            >
              요금 비교하기
            </Link>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="max-w-6xl mx-auto px-4 -mt-8">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl border border-gray-100 p-5 text-center shadow-sm">
            <div className="text-3xl font-extrabold text-indigo-600">{totalCount}</div>
            <div className="text-sm text-gray-500 mt-1">전체 주차장</div>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 p-5 text-center shadow-sm">
            <div className="text-3xl font-extrabold text-green-600">{freeCount}</div>
            <div className="text-sm text-gray-500 mt-1">무료 주차장</div>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 p-5 text-center shadow-sm">
            <div className="text-3xl font-extrabold text-blue-600">{typeStats.공영}</div>
            <div className="text-sm text-gray-500 mt-1">공영 주차장</div>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 p-5 text-center shadow-sm">
            <div className="text-3xl font-extrabold text-orange-600">{typeStats.민영}</div>
            <div className="text-sm text-gray-500 mt-1">민영 주차장</div>
          </div>
        </div>
      </section>

      {/* Region Grid */}
      <section className="max-w-6xl mx-auto px-4 py-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">
          지역별 주차장
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {regions.map((region) => {
            const count = region.sigungu.reduce((s, sg) => s + sg.parkingCount, 0);
            return (
              <Link
                key={region.sidoCode}
                href={`/region/${sidoToSlug(region.sido)}`}
                className="group bg-white rounded-2xl border border-gray-100 p-6 hover:shadow-lg hover:border-indigo-200 transition-all"
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">
                    {region.sido}
                  </h3>
                  <span className="text-2xl">🅿️</span>
                </div>
                <div className="text-sm text-gray-600 space-y-1">
                  <p>
                    총 <span className="font-semibold text-gray-900">{count}개</span> 주차장
                  </p>
                  <p className="text-gray-400">
                    {region.sigungu.length}개 시군구
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Quick Links */}
      <section className="max-w-6xl mx-auto px-4 py-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">
          빠른 메뉴
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <Link
            href="/free"
            className="group bg-green-50 rounded-2xl border border-green-100 p-6 hover:shadow-lg hover:border-green-200 transition-all"
          >
            <div className="text-4xl mb-4">🆓</div>
            <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-green-600 transition-colors">
              무료 주차장
            </h3>
            <p className="text-sm text-gray-600 leading-relaxed">
              전국 무료 주차장 위치와 운영시간을 확인하세요.
            </p>
          </Link>
          <Link
            href="/compare"
            className="group bg-indigo-50 rounded-2xl border border-indigo-100 p-6 hover:shadow-lg hover:border-indigo-200 transition-all"
          >
            <div className="text-4xl mb-4">💰</div>
            <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-indigo-600 transition-colors">
              주차 요금 비교
            </h3>
            <p className="text-sm text-gray-600 leading-relaxed">
              주차 시간을 입력하면 주변 주차장 요금을 한눈에 비교합니다.
            </p>
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="bg-gray-50 py-12">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">
            주차장 정보의 특징
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="text-center bg-white rounded-2xl p-6 border border-gray-100"
              >
                <div className="text-3xl mb-3">{feature.icon}</div>
                <h3 className="font-semibold text-gray-900 mb-1">
                  {feature.title}
                </h3>
                <p className="text-sm text-gray-600">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Cross Links */}
      <section className="max-w-6xl mx-auto px-4 py-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">
          함께 이용하면 좋은 서비스
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <a
            href="https://car.mustarddata.com"
            className="group bg-amber-50 rounded-2xl border border-amber-100 p-6 hover:shadow-lg hover:border-amber-200 transition-all"
          >
            <div className="text-3xl mb-3">🚗</div>
            <h3 className="font-bold text-gray-900 mb-1 group-hover:text-amber-600 transition-colors">
              자동차세 계산기
            </h3>
            <p className="text-sm text-gray-600">
              자동차세, 취등록세, 유류비 계산
            </p>
          </a>
          <a
            href="https://car.mustarddata.com/ev-charger"
            className="group bg-green-50 rounded-2xl border border-green-100 p-6 hover:shadow-lg hover:border-green-200 transition-all"
          >
            <div className="text-3xl mb-3">⚡</div>
            <h3 className="font-bold text-gray-900 mb-1 group-hover:text-green-600 transition-colors">
              전기차 충전소
            </h3>
            <p className="text-sm text-gray-600">
              전국 전기차 충전소 위치 검색
            </p>
          </a>
          <a
            href="https://hospital.mustarddata.com"
            className="group bg-blue-50 rounded-2xl border border-blue-100 p-6 hover:shadow-lg hover:border-blue-200 transition-all"
          >
            <div className="text-3xl mb-3">🏥</div>
            <h3 className="font-bold text-gray-900 mb-1 group-hover:text-blue-600 transition-colors">
              병원 찾기
            </h3>
            <p className="text-sm text-gray-600">
              주차장 근처 병원 정보 확인
            </p>
          </a>
          <a
            href="https://pharmacy.mustarddata.com"
            className="group bg-emerald-50 rounded-2xl border border-emerald-100 p-6 hover:shadow-lg hover:border-emerald-200 transition-all"
          >
            <div className="text-3xl mb-3">💊</div>
            <h3 className="font-bold text-gray-900 mb-1 group-hover:text-emerald-600 transition-colors">
              약국 찾기
            </h3>
            <p className="text-sm text-gray-600">
              전국 약국 위치, 영업시간 조회
            </p>
          </a>
        </div>
      </section>

      {/* SEO Content */}
      <section className="max-w-4xl mx-auto px-4 py-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          주차장 이용 시 알아두면 좋은 정보
        </h2>
        <div className="prose max-w-none text-gray-700 space-y-4">
          <p>
            주차장은 크게 공영주차장과 민영주차장으로 나뉩니다. 공영주차장은
            지방자치단체가 직접 설치·운영하는 주차장으로, 민영주차장에 비해
            요금이 저렴한 편입니다. 민영주차장은 민간 사업자가 운영하며
            위치와 시설에 따라 요금이 다양합니다.
          </p>
          <p>
            주차 형태에 따라 노상주차장(도로 위)과 노외주차장(도로 밖 별도 부지)으로
            구분됩니다. 노상주차장은 도로변 주차구획에 해당하고, 노외주차장은
            주차빌딩이나 지하주차장 등을 포함합니다.
          </p>
          <p>
            이 사이트에서는 전국 주차장의 위치, 운영시간, 요금 정보를
            지역별로 비교할 수 있습니다. 공영·민영, 유료·무료, 24시간 운영 등
            다양한 조건으로 주차장을 검색하고, 주차 시간에 따른 예상 요금을
            미리 계산해볼 수 있습니다.
          </p>
        </div>
      </section>

      {/* FAQ */}
      <section className="max-w-4xl mx-auto px-4 py-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-8">자주 묻는 질문</h2>
        <div className="space-y-6">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="bg-white rounded-2xl p-6 border border-gray-100"
            >
              <h3 className="font-semibold text-gray-900 mb-2 flex items-start gap-2">
                <span className="text-indigo-500 font-bold shrink-0">Q.</span>
                {faq.question}
              </h3>
              <p className="text-gray-600 leading-relaxed pl-6">
                <span className="text-gray-400 font-bold">A.</span> {faq.answer}
              </p>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
