import type { Metadata } from 'next';
import Link from 'next/link';
import { BASE_URL } from '@/lib/urls';
import JsonLd from '@/components/JsonLd';
import {
  getAllLandmarks,
  getLandmarkBySlug,
  getLandmarkRaw,
} from '@/lib/parking-data';

interface PageProps {
  params: Promise<{ slug: string }>;
}

interface LotPreview {
  name: string;
  address: string;
  capacity?: number;
  weekdayOpen?: string;
  weekdayClose?: string;
  distance: number;
  baseFee?: number;
  baseTime?: number;
  addFee?: number;
  addTime?: number;
  dailyMax?: number;
  parkingType?: string;
}

function landmarkSlugFromBlogSlug(blogSlug: string): string {
  return blogSlug.replace(/^parking-near-/, '');
}

export async function generateStaticParams() {
  return getAllLandmarks().map((lm) => ({
    slug: `parking-near-${lm.landmark.slug}`,
  }));
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const lmSlug = landmarkSlugFromBlogSlug(slug);
  const data = getLandmarkBySlug(lmSlug);
  if (!data) return { title: '글을 찾을 수 없습니다' };

  const { name } = data.landmark;
  const title = `${name} 근처 주차장 요금 비교 - 무료·공영 주차장 총정리 (2026)`;
  const description = `${name} 근처 주차장 ${data.total}곳의 요금과 위치를 비교합니다. 무료 주차장 ${data.free}곳, 공영 주차장 ${data.public}곳의 운영시간과 요금 정보를 한눈에 확인하세요.`;

  return {
    title,
    description,
    keywords: [
      `${name} 주차장`,
      `${name} 주차 요금`,
      `${name} 무료 주차장`,
      `${name} 공영 주차장`,
      `${name} 주차 꿀팁`,
      `${name} 근처 저렴한 주차장`,
    ],
    alternates: { canonical: `${BASE_URL}/blog/${slug}` },
    openGraph: {
      title,
      description,
      url: `${BASE_URL}/blog/${slug}`,
      type: 'article',
    },
  };
}

function formatFee(fee: number): string {
  return fee.toLocaleString() + '원';
}

export default async function BlogPostPage({ params }: PageProps) {
  const { slug } = await params;
  const lmSlug = landmarkSlugFromBlogSlug(slug);
  const data = getLandmarkBySlug(lmSlug);
  const raw = getLandmarkRaw(lmSlug);

  if (!data || !raw) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-10 text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          글을 찾을 수 없습니다
        </h1>
        <Link href="/blog" className="text-indigo-600 hover:underline">
          블로그 목록으로
        </Link>
      </div>
    );
  }

  const { landmark } = data;
  const topFree: LotPreview[] = raw.topFree || [];
  const topPublic: LotPreview[] = raw.topPublic || [];
  const cheapest: LotPreview[] = raw.cheapest || [];
  const freeRatio =
    data.total > 0 ? Math.round((data.free / data.total) * 100) : 0;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: `${landmark.name} 근처 주차장 요금 비교 - 무료·공영 주차장 총정리`,
    description: `${landmark.name} 근처 주차장 ${data.total}곳의 요금과 위치를 비교합니다.`,
    url: `${BASE_URL}/blog/${slug}`,
    datePublished: '2026-02-11',
    dateModified: '2026-02-11',
    author: { '@type': 'Organization', name: 'MustardData' },
    publisher: { '@type': 'Organization', name: 'MustardData' },
  };

  return (
    <>
      <JsonLd data={jsonLd} />

      <article className="max-w-4xl mx-auto px-4 py-10">
        <nav className="text-sm text-gray-500 mb-6">
          <Link href="/" className="hover:text-indigo-600">홈</Link>
          <span className="mx-2">›</span>
          <Link href="/blog" className="hover:text-indigo-600">블로그</Link>
          <span className="mx-2">›</span>
          <span className="text-gray-900">{landmark.name} 주차장</span>
        </nav>

        <header className="mb-10">
          <div className="flex items-center gap-2 mb-3">
            <span className="px-2 py-0.5 rounded text-xs font-medium bg-indigo-100 text-indigo-700">
              {landmark.category}
            </span>
            <time className="text-xs text-gray-400" dateTime="2026-02-11">
              2026.02.11
            </time>
          </div>
          <h1 className="text-3xl font-extrabold text-gray-900 mb-4">
            {landmark.name} 근처 주차장 요금 비교 — 무료·공영 주차장 총정리
          </h1>
          <p className="text-lg text-gray-600">
            {landmark.name}({landmark.description}) 근처 주차장{' '}
            {data.total}곳의 요금과 위치를 비교합니다. 무료 주차장 {data.free}곳,
            공영 주차장 {data.public}곳의 운영시간과 요금 정보를 한눈에
            확인하세요.
          </p>
        </header>

        <div className="prose prose-gray max-w-none">
          <h2>{landmark.name} 근처 주차장 현황</h2>
          <p>
            {landmark.name} 반경 1km 이내에는 <strong>총 {data.total}곳</strong>
            의 주차장이 있습니다. 이 중 무료 주차장이 {data.free}곳({freeRatio}%),
            유료 주차장이 {data.paid}곳, 공영 주차장이 {data.public}곳입니다.
          </p>

          <div className="not-prose grid grid-cols-2 sm:grid-cols-4 gap-3 my-6">
            <div className="bg-indigo-50 rounded-xl p-4 text-center">
              <div className="text-2xl font-extrabold text-indigo-600">{data.total}</div>
              <div className="text-xs text-gray-500">전체</div>
            </div>
            <div className="bg-green-50 rounded-xl p-4 text-center">
              <div className="text-2xl font-extrabold text-green-600">{data.free}</div>
              <div className="text-xs text-gray-500">무료</div>
            </div>
            <div className="bg-blue-50 rounded-xl p-4 text-center">
              <div className="text-2xl font-extrabold text-blue-600">{data.public}</div>
              <div className="text-xs text-gray-500">공영</div>
            </div>
            <div className="bg-orange-50 rounded-xl p-4 text-center">
              <div className="text-2xl font-extrabold text-orange-600">{data.paid}</div>
              <div className="text-xs text-gray-500">유료</div>
            </div>
          </div>

          {data.avgBaseFee > 0 && (
            <>
              <h2>{landmark.name} 주차장 평균 요금</h2>
              <p>
                {landmark.name} 근처 유료 주차장의 평균 기본요금은{' '}
                <strong>{formatFee(Math.round(data.avgBaseFee))}</strong>이며,
                추가요금은 평균 {formatFee(Math.round(data.avgAddFee))}입니다.
                {data.avgDailyMax > 0 &&
                  ` 일 최대요금은 평균 ${formatFee(Math.round(data.avgDailyMax))}입니다.`}
              </p>
              <p>
                기본요금은 최초 주차 시간(보통 30분)에 대한 요금이며, 이후 추가
                시간(보통 10분)당 추가요금이 부과됩니다. 장시간 주차 시에는
                일 최대요금이 적용되는 주차장을 선택하면 요금 폭탄을 피할 수
                있습니다.
              </p>
            </>
          )}

          {topFree.length > 0 && (
            <>
              <h2>{landmark.name} 근처 무료 주차장</h2>
              <p>
                {landmark.name} 주변에는{' '}
                <strong>{data.free}곳의 무료 주차장</strong>이 있습니다.
                {data.free > 5 && ` 가장 가까운 ${topFree.length}곳을 소개합니다.`}
              </p>

              <div className="not-prose space-y-3 my-6">
                {topFree.map((lot, idx) => (
                  <div
                    key={idx}
                    className="bg-green-50 rounded-xl border border-green-100 p-4"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-gray-900">{lot.name}</span>
                      <span className="px-1.5 py-0.5 rounded text-xs bg-green-100 text-green-700">무료</span>
                      {lot.weekdayOpen === '00:00' && lot.weekdayClose === '23:59' && (
                        <span className="px-1.5 py-0.5 rounded text-xs bg-purple-100 text-purple-700">24시간</span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500">{lot.address}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {lot.capacity && `${lot.capacity.toLocaleString()}면 | `}
                      {lot.distance}m 거리
                    </p>
                  </div>
                ))}
              </div>

              <p>
                무료 주차장은 주말이나 공휴일에 혼잡할 수 있으므로 여유 있게
                도착하는 것을 추천합니다.
              </p>
            </>
          )}

          {topPublic.length > 0 && (
            <>
              <h2>{landmark.name} 근처 공영 주차장 요금</h2>
              <p>
                공영 주차장은 지방자치단체가 운영하여 민영 주차장보다 요금이
                저렴한 편입니다.
              </p>

              <div className="not-prose space-y-3 my-6">
                {topPublic.map((lot, idx) => (
                  <div
                    key={idx}
                    className="bg-blue-50 rounded-xl border border-blue-100 p-4"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-gray-900">{lot.name}</span>
                      <span className="px-1.5 py-0.5 rounded text-xs bg-blue-100 text-blue-700">공영</span>
                    </div>
                    <p className="text-sm text-gray-500">{lot.address}</p>
                    <div className="flex flex-wrap gap-3 text-xs text-gray-600 mt-2">
                      <span>기본 {formatFee(lot.baseFee || 0)}/{lot.baseTime || 30}분</span>
                      <span>추가 {formatFee(lot.addFee || 0)}/{lot.addTime || 10}분</span>
                      {lot.dailyMax && lot.dailyMax > 0 && (
                        <span>일 최대 {formatFee(lot.dailyMax)}</span>
                      )}
                      <span>{lot.distance}m 거리</span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {cheapest.length > 0 && (
            <>
              <h2>{landmark.name} 근처 저렴한 주차장 TOP {cheapest.length}</h2>
              <p>요금이 가장 저렴한 유료 주차장을 정리했습니다.</p>

              <div className="not-prose space-y-3 my-6">
                {cheapest.map((lot, idx) => (
                  <div
                    key={idx}
                    className="bg-white rounded-xl border border-gray-200 p-4"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="flex items-center justify-center w-6 h-6 rounded-full bg-orange-100 text-orange-700 text-xs font-bold">
                        {idx + 1}
                      </span>
                      <span className="font-bold text-gray-900">{lot.name}</span>
                      {lot.parkingType && (
                        <span className={`px-1.5 py-0.5 rounded text-xs ${
                          lot.parkingType === '공영'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-gray-100 text-gray-600'
                        }`}>
                          {lot.parkingType}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500">{lot.address}</p>
                    <div className="flex flex-wrap gap-3 text-xs text-gray-600 mt-2">
                      <span>기본 {formatFee(lot.baseFee || 0)}/{lot.baseTime || 30}분</span>
                      <span>추가 {formatFee(lot.addFee || 0)}/{lot.addTime || 10}분</span>
                      {lot.dailyMax && lot.dailyMax > 0 && (
                        <span>일 최대 {formatFee(lot.dailyMax)}</span>
                      )}
                      <span>{lot.distance}m 거리</span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          <h2>{landmark.name} 주차 요금 절약 팁</h2>
          <ol>
            {data.free > 0 && (
              <li>
                <strong>무료 주차장 우선 확인</strong>: {landmark.name} 근처에는{' '}
                {data.free}곳의 무료 주차장이 있습니다. 조금 걸어야 하더라도
                무료 주차장을 이용하면 비용을 크게 절약할 수 있습니다.
              </li>
            )}
            <li>
              <strong>공영 주차장 이용</strong>: 공영 주차장은 민영보다 평균
              30~50% 저렴합니다.
            </li>
            <li>
              <strong>일 최대 요금 확인</strong>: 장시간 주차 시에는 일 최대 요금이
              설정된 주차장을 선택하면 예상치 못한 요금 폭탄을 피할 수 있습니다.
            </li>
            <li>
              <strong>주말·공휴일 요금 확인</strong>: 일부 공영 주차장은 주말에
              무료 또는 할인 요금을 적용합니다.
            </li>
            <li>
              <strong>대중교통 병행</strong>: 주차비가 부담된다면 외곽 무료
              주차장에 주차 후 대중교통으로 이동하는 것도 좋은 방법입니다.
            </li>
          </ol>

          <h2>자주 묻는 질문</h2>

          <h3>{landmark.name} 근처 주차장 요금은 얼마인가요?</h3>
          <p>
            {data.avgBaseFee > 0
              ? `${landmark.name} 근처 유료 주차장의 평균 기본요금은 ${formatFee(Math.round(data.avgBaseFee))}입니다.${
                  cheapest.length > 0
                    ? ` 가장 저렴한 주차장은 ${cheapest[0].name}으로 ${formatFee(cheapest[0].baseFee || 0)}/${cheapest[0].baseTime || 30}분입니다.`
                    : ''
                }`
              : `${landmark.name} 근처 주차장은 대부분 무료로 운영됩니다.`}
          </p>

          <h3>{landmark.name} 근처에 무료 주차장이 있나요?</h3>
          <p>
            {data.free > 0
              ? `네, ${landmark.name} 반경 1km 이내에 무료 주차장이 ${data.free}곳 있습니다.${
                  topFree.length > 0
                    ? ` 가장 가까운 무료 주차장은 ${topFree[0].name}(${topFree[0].distance}m)입니다.`
                    : ''
                }`
              : `${landmark.name} 반경 1km 내에는 무료 주차장이 없습니다. 유료 주차장을 이용해주세요.`}
          </p>

          <h3>{landmark.name} 근처 공영 주차장은 몇 곳인가요?</h3>
          <p>
            {landmark.name} 반경 1km 이내에 공영 주차장이 {data.public}곳
            있습니다. 공영 주차장은 지자체가 운영하여 민영 주차장보다 요금이
            저렴합니다.
          </p>
        </div>

        {/* CTA */}
        <div className="mt-10 bg-indigo-50 rounded-2xl p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">
            {landmark.name} 주차장 상세 정보
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Link
              href={`/near/${landmark.slug}`}
              className="bg-white rounded-xl border border-indigo-100 p-4 text-center hover:shadow-md transition-all"
            >
              <div className="text-2xl mb-1">📍</div>
              <div className="text-sm font-semibold text-gray-900">
                {landmark.name} 근처 주차장
              </div>
            </Link>
            <Link
              href="/free"
              className="bg-white rounded-xl border border-indigo-100 p-4 text-center hover:shadow-md transition-all"
            >
              <div className="text-2xl mb-1">🆓</div>
              <div className="text-sm font-semibold text-gray-900">
                무료 주차장 찾기
              </div>
            </Link>
            <Link
              href="/compare"
              className="bg-white rounded-xl border border-indigo-100 p-4 text-center hover:shadow-md transition-all"
            >
              <div className="text-2xl mb-1">💰</div>
              <div className="text-sm font-semibold text-gray-900">
                요금 비교하기
              </div>
            </Link>
          </div>
        </div>

        <RelatedPosts currentSlug={landmark.slug} />
      </article>
    </>
  );
}

function RelatedPosts({ currentSlug }: { currentSlug: string }) {
  const all = getAllLandmarks().filter((lm) => lm.landmark.slug !== currentSlug);
  const related = all.slice(0, 4);

  return (
    <section className="mt-10">
      <h2 className="text-xl font-bold text-gray-900 mb-4">다른 주차장 글</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {related.map((lm) => (
          <Link
            key={lm.landmark.slug}
            href={`/blog/parking-near-${lm.landmark.slug}`}
            className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-lg hover:border-indigo-200 transition-all"
          >
            <span className="text-xs text-gray-400">{lm.landmark.category}</span>
            <h3 className="font-bold text-gray-900 mt-1">
              {lm.landmark.name} 근처 주차장 요금 비교
            </h3>
            <p className="text-xs text-gray-500 mt-1">
              주차장 {lm.total}곳 | 무료 {lm.free}곳
            </p>
          </Link>
        ))}
      </div>
    </section>
  );
}
