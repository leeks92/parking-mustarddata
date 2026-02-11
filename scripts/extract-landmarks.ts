/**
 * 랜드마크 근처 주차장 데이터 추출 스크립트
 * 블로그 포스트 작성용 데이터 생성
 *
 * 사용법: npx tsx scripts/extract-landmarks.ts
 */

import * as fs from 'fs';
import * as path from 'path';

interface ParkingLot {
  id: string;
  name: string;
  address: string;
  sido: string;
  sigungu: string;
  parkingType: string;
  operationType: string;
  capacity: number;
  weekdayOpen: string;
  weekdayClose: string;
  satOpen: string;
  satClose: string;
  sunOpen: string;
  sunClose: string;
  baseTime: number;
  baseFee: number;
  addTime: number;
  addFee: number;
  dailyMax: number;
  monthlyFee: number;
  isFree: boolean;
  lat: number;
  lng: number;
}

interface Landmark {
  name: string;
  slug: string;
  lat: number;
  lng: number;
  category: string;
  description: string;
}

// 랜드마크 정의 (검색량 높은 순)
const LANDMARKS: Landmark[] = [
  // 서울 역세권
  { name: '강남역', slug: 'gangnam-station', lat: 37.4979, lng: 127.0276, category: '서울 역세권', description: '서울 최대 상업지구' },
  { name: '서울역', slug: 'seoul-station', lat: 37.5547, lng: 126.9707, category: '서울 역세권', description: 'KTX·지하철 환승 허브' },
  { name: '홍대입구역', slug: 'hongdae-station', lat: 37.5571, lng: 126.9246, category: '서울 역세권', description: '홍대 문화거리 중심' },
  { name: '잠실역', slug: 'jamsil-station', lat: 37.5133, lng: 127.1001, category: '서울 역세권', description: '롯데월드·올림픽공원 인접' },
  { name: '명동역', slug: 'myeongdong-station', lat: 37.5609, lng: 126.9862, category: '서울 역세권', description: '쇼핑·관광 중심지' },
  { name: '여의도역', slug: 'yeouido-station', lat: 37.5216, lng: 126.9243, category: '서울 역세권', description: '금융·방송 중심지' },
  { name: '신촌역', slug: 'sinchon-station', lat: 37.5553, lng: 126.9366, category: '서울 역세권', description: '대학가 밀집 지역' },
  { name: '건대입구역', slug: 'kondae-station', lat: 37.5404, lng: 127.0693, category: '서울 역세권', description: '건국대·커먼그라운드' },
  { name: '합정역', slug: 'hapjeong-station', lat: 37.5497, lng: 126.9139, category: '서울 역세권', description: '망원·합정 카페거리' },
  { name: '종로3가역', slug: 'jongno3-station', lat: 37.5710, lng: 126.9920, category: '서울 역세권', description: '종묘·인사동·탑골공원' },
  { name: '이태원역', slug: 'itaewon-station', lat: 37.5346, lng: 126.9946, category: '서울 역세권', description: '이태원 맛집·카페 거리' },
  { name: '삼성역', slug: 'samsung-station', lat: 37.5089, lng: 127.0637, category: '서울 역세권', description: '코엑스·현대백화점' },

  // 서울 랜드마크
  { name: '코엑스', slug: 'coex', lat: 37.5120, lng: 127.0590, category: '서울 랜드마크', description: '전시·컨벤션·쇼핑몰' },
  { name: '동대문시장', slug: 'dongdaemun-market', lat: 37.5670, lng: 127.0095, category: '서울 랜드마크', description: '패션·원단 도매시장' },
  { name: '광화문', slug: 'gwanghwamun', lat: 37.5760, lng: 126.9769, category: '서울 랜드마크', description: '경복궁·광화문광장' },
  { name: '남대문시장', slug: 'namdaemun-market', lat: 37.5592, lng: 126.9773, category: '서울 랜드마크', description: '전통시장·수입 상품' },
  { name: '가로수길', slug: 'garosugil', lat: 37.5199, lng: 127.0231, category: '서울 랜드마크', description: '신사동 카페·패션 거리' },
  { name: '북촌한옥마을', slug: 'bukchon-hanok', lat: 37.5827, lng: 126.9836, category: '서울 랜드마크', description: '전통 한옥 관광지' },
  { name: '여의도 한강공원', slug: 'yeouido-hangang', lat: 37.5270, lng: 126.9340, category: '서울 랜드마크', description: '봄꽃·불꽃축제 명소' },
  { name: '잠실 롯데월드', slug: 'lotte-world', lat: 37.5112, lng: 127.0981, category: '서울 랜드마크', description: '테마파크·쇼핑몰' },

  // 서울 병원
  { name: '서울아산병원', slug: 'asan-hospital', lat: 37.5268, lng: 127.1084, category: '서울 병원', description: '송파구 대형 종합병원' },
  { name: '삼성서울병원', slug: 'samsung-hospital', lat: 37.4881, lng: 127.0855, category: '서울 병원', description: '강남구 대형 종합병원' },
  { name: '세브란스병원', slug: 'severance-hospital', lat: 37.5622, lng: 126.9410, category: '서울 병원', description: '신촌 연세의료원' },
  { name: '서울대병원', slug: 'snuh-hospital', lat: 37.5796, lng: 126.9990, category: '서울 병원', description: '종로구 국립대병원' },

  // 수도권
  { name: '수원역', slug: 'suwon-station', lat: 37.2660, lng: 127.0001, category: '수도권', description: '경기 남부 교통 중심' },
  { name: '인천공항', slug: 'incheon-airport', lat: 37.4602, lng: 126.4407, category: '수도권', description: '국제공항 장기주차' },
  { name: '판교역', slug: 'pangyo-station', lat: 37.3947, lng: 127.1113, category: '수도권', description: 'IT 기업 밀집 지역' },
  { name: '일산 킨텍스', slug: 'kintex', lat: 37.6709, lng: 126.7451, category: '수도권', description: '전시·컨벤션센터' },
  { name: '분당 서현역', slug: 'seohyeon-station', lat: 37.3846, lng: 127.1231, category: '수도권', description: '분당 중심 상업지구' },

  // 지방 주요 도시
  { name: '부산역', slug: 'busan-station', lat: 35.1152, lng: 129.0405, category: '지방', description: 'KTX 부산 도착역' },
  { name: '해운대', slug: 'haeundae', lat: 35.1587, lng: 129.1604, category: '지방', description: '부산 대표 해수욕장' },
  { name: '서면역', slug: 'seomyeon-station', lat: 35.1579, lng: 129.0597, category: '지방', description: '부산 최대 번화가' },
  { name: '대구역', slug: 'daegu-station', lat: 35.8791, lng: 128.6283, category: '지방', description: '대구 도심 중심' },
  { name: '동성로', slug: 'dongseongro', lat: 35.8694, lng: 128.5966, category: '지방', description: '대구 대표 번화가' },
  { name: '인천역', slug: 'incheon-station', lat: 37.4734, lng: 126.6214, category: '지방', description: '차이나타운·월미도' },
  { name: '대전역', slug: 'daejeon-station', lat: 36.3326, lng: 127.4343, category: '지방', description: '충청권 교통 중심' },
  { name: '광주 충장로', slug: 'chungjangro', lat: 35.1490, lng: 126.9190, category: '지방', description: '광주 대표 상권' },
];

// 거리 계산 (Haversine formula, km 단위)
function getDistanceKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function main() {
  const dataPath = path.join(__dirname, '..', 'data', 'parking-lots.json');
  const lots: ParkingLot[] = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
  console.log(`총 ${lots.length}개 주차장 로드\n`);

  const RADIUS_KM = 1.0; // 반경 1km

  const results: Record<string, any> = {};

  for (const lm of LANDMARKS) {
    const nearby = lots
      .map((lot) => ({
        ...lot,
        distance: getDistanceKm(lm.lat, lm.lng, lot.lat, lot.lng),
      }))
      .filter((lot) => lot.distance <= RADIUS_KM)
      .sort((a, b) => a.distance - b.distance);

    const freeLots = nearby.filter((l) => l.isFree);
    const paidLots = nearby.filter((l) => !l.isFree);
    const publicLots = nearby.filter((l) => l.parkingType === '공영' || l.parkingType === '노외' || l.parkingType === '노상');

    // 유료 주차장 평균 요금
    const paidWithFee = paidLots.filter((l) => l.baseFee > 0);
    const avgBaseFee = paidWithFee.length > 0 ? Math.round(paidWithFee.reduce((s, l) => s + l.baseFee, 0) / paidWithFee.length) : 0;
    const avgAddFee = paidWithFee.length > 0 ? Math.round(paidWithFee.reduce((s, l) => s + l.addFee, 0) / paidWithFee.length) : 0;
    const avgDailyMax = paidWithFee.filter((l) => l.dailyMax > 0).length > 0
      ? Math.round(paidWithFee.filter((l) => l.dailyMax > 0).reduce((s, l) => s + l.dailyMax, 0) / paidWithFee.filter((l) => l.dailyMax > 0).length)
      : 0;

    results[lm.slug] = {
      landmark: lm,
      total: nearby.length,
      free: freeLots.length,
      paid: paidLots.length,
      public: publicLots.length,
      avgBaseFee,
      avgAddFee,
      avgDailyMax,
      // 상위 5개 무료 주차장
      topFree: freeLots.slice(0, 5).map((l) => ({
        name: l.name, address: l.address, capacity: l.capacity,
        weekdayOpen: l.weekdayOpen, weekdayClose: l.weekdayClose,
        distance: Math.round(l.distance * 1000),
      })),
      // 상위 5개 공영 주차장
      topPublic: publicLots.filter(l => !l.isFree).slice(0, 5).map((l) => ({
        name: l.name, address: l.address, capacity: l.capacity,
        baseFee: l.baseFee, baseTime: l.baseTime, addFee: l.addFee, addTime: l.addTime, dailyMax: l.dailyMax,
        distance: Math.round(l.distance * 1000),
      })),
      // 상위 5개 저렴한 유료 주차장
      cheapest: paidWithFee.sort((a, b) => a.baseFee - b.baseFee).slice(0, 5).map((l) => ({
        name: l.name, address: l.address, parkingType: l.parkingType,
        baseFee: l.baseFee, baseTime: l.baseTime, addFee: l.addFee, addTime: l.addTime, dailyMax: l.dailyMax,
        distance: Math.round(l.distance * 1000),
      })),
    };

    console.log(`${lm.name}: 총 ${nearby.length}개 (무료 ${freeLots.length}, 유료 ${paidLots.length}, 공영 ${publicLots.length})`);
  }

  const outputPath = path.join(__dirname, '..', 'data', 'landmark-parking.json');
  fs.writeFileSync(outputPath, JSON.stringify(results, null, 2), 'utf-8');
  console.log(`\n저장: ${outputPath}`);
}

main();
