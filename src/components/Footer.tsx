import Link from 'next/link';
import SisterSites from './SisterSites';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-100 border-t mt-12">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-8">
          <div>
            <h3 className="font-bold mb-3 text-gray-900">지역별 주차장</h3>
            <ul className="space-y-2 text-sm text-gray-700">
              <li>
                <Link href="/region/seoul" className="hover:text-indigo-600">
                  서울 주차장
                </Link>
              </li>
              <li>
                <Link href="/region/gyeonggi" className="hover:text-indigo-600">
                  경기 주차장
                </Link>
              </li>
              <li>
                <Link href="/region/busan" className="hover:text-indigo-600">
                  부산 주차장
                </Link>
              </li>
              <li>
                <Link href="/region/incheon" className="hover:text-indigo-600">
                  인천 주차장
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="font-bold mb-3 text-gray-900">주차장 검색</h3>
            <ul className="space-y-2 text-sm text-gray-700">
              <li>
                <Link href="/free" className="hover:text-indigo-600">
                  무료 주차장
                </Link>
              </li>
              <li>
                <Link href="/near" className="hover:text-indigo-600">
                  근처 주차장
                </Link>
              </li>
              <li>
                <Link href="/compare" className="hover:text-indigo-600">
                  요금 비교
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="font-bold mb-3 text-gray-900">연관 서비스</h3>
            <ul className="space-y-2 text-sm text-gray-700">
              <li>
                <a
                  href="https://car.mustarddata.com"
                  className="hover:text-indigo-600"
                >
                  자동차세 계산기
                </a>
              </li>
              <li>
                <a
                  href="https://car.mustarddata.com/ev-charger"
                  className="hover:text-indigo-600"
                >
                  전기차 충전소 찾기
                </a>
              </li>
              <li>
                <a
                  href="https://hospital.mustarddata.com"
                  className="hover:text-indigo-600"
                >
                  병원 찾기
                </a>
              </li>
              <li>
                <a
                  href="https://pharmacy.mustarddata.com"
                  className="hover:text-indigo-600"
                >
                  약국 찾기
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="font-bold mb-3 text-gray-900">유용한 사이트</h3>
            <ul className="space-y-2 text-sm text-gray-700">
              <li>
                <a
                  href="https://www.molit.go.kr"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-indigo-600"
                >
                  국토교통부
                </a>
              </li>
              <li>
                <a
                  href="https://www.data.go.kr"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-indigo-600"
                >
                  공공데이터포털
                </a>
              </li>
            </ul>
          </div>
          <div>
            <SisterSites currentSite="parking" />
          </div>
        </div>
        <div className="mt-8 pt-6 border-t text-center text-sm text-gray-600">
          <p>
            © {currentYear} MustardData. 본 사이트의 정보는 참고용이며,
            정확한 주차장 정보는 해당 주차장에 직접 문의하시기 바랍니다.
          </p>
          <p className="mt-2">
            주차장 데이터는{' '}
            <a
              href="https://www.data.go.kr"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-indigo-600"
            >
              한국교통안전공단 주차정보 API
            </a>{' '}
            (공공데이터포털) 기준이며, 실제 운영 현황과 다를 수 있습니다.
          </p>
        </div>
      </div>
    </footer>
  );
}
