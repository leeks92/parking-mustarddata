import type { ParkingLot, Region, LandmarkData } from './types';
export type { LandmarkData };
import rawData from '../../data/parking-lots.json';
import landmarkRaw from '../../data/landmark-parking.json';

const parkingLots: ParkingLot[] = rawData as unknown as ParkingLot[];

// 슬러그 변환
const SIDO_SLUG_MAP: Record<string, string> = {
  서울: 'seoul',
  경기: 'gyeonggi',
  부산: 'busan',
  인천: 'incheon',
  대구: 'daegu',
  대전: 'daejeon',
  광주: 'gwangju',
  울산: 'ulsan',
  세종: 'sejong',
  강원: 'gangwon',
  충북: 'chungbuk',
  충남: 'chungnam',
  전북: 'jeonbuk',
  전남: 'jeonnam',
  경북: 'gyeongbuk',
  경남: 'gyeongnam',
  제주: 'jeju',
};

const SLUG_SIDO_MAP: Record<string, string> = Object.fromEntries(
  Object.entries(SIDO_SLUG_MAP).map(([k, v]) => [v, k])
);

export function sidoToSlug(sido: string): string {
  return SIDO_SLUG_MAP[sido] || sido.toLowerCase();
}

export function slugToSido(slug: string): string {
  return SLUG_SIDO_MAP[slug] || slug;
}

export function sigunguToSlug(sigungu: string): string {
  return encodeURIComponent(sigungu);
}

export function slugToSigungu(slug: string): string {
  return decodeURIComponent(slug);
}

// 전체 주차장 목록
export function getAllParkingLots(): ParkingLot[] {
  return parkingLots;
}

// ID로 주차장 찾기
export function getParkingLotById(id: string): ParkingLot | undefined {
  return parkingLots.find((p) => p.id === id);
}

// 전체 주차장 ID 목록
export function getAllParkingIds(): string[] {
  return parkingLots.map((p) => p.id);
}

// 지역 목록 생성
export function getRegions(): Region[] {
  const regionMap = new Map<string, Map<string, number>>();

  for (const lot of parkingLots) {
    if (!regionMap.has(lot.sido)) {
      regionMap.set(lot.sido, new Map());
    }
    const sigunguMap = regionMap.get(lot.sido)!;
    sigunguMap.set(lot.sigungu, (sigunguMap.get(lot.sigungu) || 0) + 1);
  }

  const regions: Region[] = [];
  for (const [sido, sigunguMap] of regionMap) {
    const sidoCode = sidoToSlug(sido);
    const sigungu = Array.from(sigunguMap.entries()).map(([name, count]) => ({
      name,
      code: sigunguToSlug(name),
      parkingCount: count,
    }));
    regions.push({ sido, sidoCode, sigungu });
  }

  return regions;
}

// 시도별 주차장
export function getParkingBySido(sido: string): ParkingLot[] {
  return parkingLots.filter((p) => p.sido === sido);
}

// 시군구별 주차장
export function getParkingBySigungu(sido: string, sigungu: string): ParkingLot[] {
  return parkingLots.filter((p) => p.sido === sido && p.sigungu === sigungu);
}

// 무료 주차장
export function getFreeParkingLots(): ParkingLot[] {
  return parkingLots.filter((p) => p.isFree);
}

// 시도별 무료 주차장
export function getFreeParkingBySido(sido: string): ParkingLot[] {
  return parkingLots.filter((p) => p.isFree && p.sido === sido);
}

// 시군구별 무료 주차장
export function getFreeParkingBySigungu(sido: string, sigungu: string): ParkingLot[] {
  return parkingLots.filter((p) => p.isFree && p.sido === sido && p.sigungu === sigungu);
}

// 전체 주차장 수
export function getTotalParkingCount(): number {
  return parkingLots.length;
}

// 시도별 주차장 수
export function getRegionParkingCount(sido: string): number {
  return parkingLots.filter((p) => p.sido === sido).length;
}

// 24시간 운영 여부
export function is24Hours(lot: ParkingLot): boolean {
  return lot.weekdayOpen === '00:00' && lot.weekdayClose === '23:59';
}

// 주차 요금 계산
export function calculateFee(lot: ParkingLot, minutes: number): number {
  if (lot.isFree || minutes <= 0) return 0;
  if (lot.baseTime === 0) return 0;

  let fee = 0;
  if (minutes <= lot.baseTime) {
    fee = lot.baseFee;
  } else {
    fee = lot.baseFee;
    const remainingMinutes = minutes - lot.baseTime;
    if (lot.addTime > 0) {
      fee += Math.ceil(remainingMinutes / lot.addTime) * lot.addFee;
    }
  }

  if (lot.dailyMax > 0) {
    fee = Math.min(fee, lot.dailyMax);
  }

  return fee;
}

// 주차장 유형별 통계
export function getParkingTypeStats(lots: ParkingLot[]) {
  const stats = { 공영: 0, 민영: 0, 노외: 0, 노상: 0 };
  for (const lot of lots) {
    stats[lot.parkingType]++;
  }
  return stats;
}

// 근처 주차장 찾기 (간단한 유클리드 거리)
export function getNearbyParkingLots(
  lot: ParkingLot,
  maxCount: number = 5
): ParkingLot[] {
  return parkingLots
    .filter((p) => p.id !== lot.id)
    .map((p) => ({
      lot: p,
      distance: Math.sqrt(
        Math.pow(p.lat - lot.lat, 2) + Math.pow(p.lng - lot.lng, 2)
      ),
    }))
    .sort((a, b) => a.distance - b.distance)
    .slice(0, maxCount)
    .map((item) => item.lot);
}

// 시도별 시군구 목록 (특정 시도)
export function getSigunguList(sido: string): string[] {
  const sigunguSet = new Set<string>();
  for (const lot of parkingLots) {
    if (lot.sido === sido) {
      sigunguSet.add(lot.sigungu);
    }
  }
  return Array.from(sigunguSet).sort();
}

// ─── 랜드마크 관련 ───

const landmarkData = landmarkRaw as Record<string, LandmarkData>;

const MIN_LANDMARK_LOTS = 5;

export function getAllLandmarks(): LandmarkData[] {
  return Object.values(landmarkData).filter((d) => d.total >= MIN_LANDMARK_LOTS);
}

export function getAllLandmarkSlugs(): string[] {
  return Object.entries(landmarkData)
    .filter(([, d]) => d.total >= MIN_LANDMARK_LOTS)
    .map(([slug]) => slug);
}

export function getLandmarkBySlug(slug: string): LandmarkData | undefined {
  const data = landmarkData[slug];
  if (!data || data.total < MIN_LANDMARK_LOTS) return undefined;
  return data;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getLandmarkRaw(slug: string): any | undefined {
  const data = (landmarkRaw as Record<string, unknown>)[slug];
  return data || undefined;
}

// 좌표 기반 근처 주차장 찾기 (Haversine 근사, 반경 km)
export function getParkingNearCoords(
  lat: number,
  lng: number,
  radiusKm: number = 1.0,
  maxCount: number = 50
): ParkingLot[] {
  const KM_PER_DEG_LAT = 111.32;
  const KM_PER_DEG_LNG = 111.32 * Math.cos((lat * Math.PI) / 180);

  return parkingLots
    .map((p) => {
      const dLat = (p.lat - lat) * KM_PER_DEG_LAT;
      const dLng = (p.lng - lng) * KM_PER_DEG_LNG;
      const distKm = Math.sqrt(dLat * dLat + dLng * dLng);
      return { lot: p, distKm };
    })
    .filter((item) => item.distKm <= radiusKm && item.lot.lat !== 0)
    .sort((a, b) => a.distKm - b.distKm)
    .slice(0, maxCount)
    .map((item) => item.lot);
}
