import type { Metadata } from 'next';
import Link from 'next/link';
import { BASE_URL } from '@/lib/urls';
import JsonLd from '@/components/JsonLd';
import { getAllParkingLots, getRegions } from '@/lib/parking-data';
import CompareClient from './CompareClient';

export const metadata: Metadata = {
  title: '주차 요금 비교 - 주차장별 요금 한눈에 비교',
  description:
    '주차 시간을 입력하면 전국 주차장 요금을 한눈에 비교합니다. 지역별, 시간별 주차 비용을 쉽게 확인하세요.',
  keywords: ['주차 요금 비교', '주차비 비교', '주차장 요금', '저렴한 주차장'],
  alternates: { canonical: `${BASE_URL}/compare` },
  openGraph: {
    title: '주차 요금 비교 - 주차장별 요금 한눈에 비교',
    description: '주차 시간 입력 후 전국 주차장 요금을 비교하세요.',
    url: `${BASE_URL}/compare`,
  },
};

const faqItems = [
  {
    q: '주차 요금 비교는 어떻게 사용하나요?',
    a: '주차 시간(분)을 입력하고 지역을 선택하면, 해당 조건에 맞는 주차장 요금이 자동으로 계산되어 저렴한 순서로 정렬됩니다.',
  },
  {
    q: '일 최대 요금이란 무엇인가요?',
    a: '하루 중 주차 요금의 상한선입니다. 시간제 요금이 일 최대 요금을 초과하면, 일 최대 요금만 부과됩니다. 장시간 주차 시 유리합니다.',
  },
  {
    q: '월정기 주차란 무엇인가요?',
    a: '한 달 단위로 요금을 지불하고 주차장을 이용하는 방식입니다. 주로 직장인이나 거주자가 이용하며, 시간제보다 저렴한 경우가 많습니다.',
  },
];

export default function ComparePage() {
  const allLots = getAllParkingLots();
  const regions = getRegions().map((r) => r.sido);

  return (
    <>
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'WebPage',
          name: '주차 요금 비교',
          description: '전국 주차장 요금 비교 도구',
          url: `${BASE_URL}/compare`,
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
        <nav className="text-sm text-gray-500 mb-6">
          <Link href="/" className="hover:text-indigo-600">홈</Link>
          <span className="mx-2">›</span>
          <span className="text-gray-900">요금 비교</span>
        </nav>

        <h1 className="text-3xl font-extrabold text-gray-900 mb-4">
          주차 요금 비교
        </h1>
        <p className="text-lg text-gray-600 mb-10">
          주차 시간을 입력하면 전국 주차장 요금을 한눈에 비교합니다.
        </p>

        <CompareClient allLots={allLots} regions={regions} />

        {/* FAQ */}
        <section className="mt-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">자주 묻는 질문</h2>
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
      </div>
    </>
  );
}
