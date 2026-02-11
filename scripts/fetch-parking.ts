/**
 * 주차정보시스템 공공데이터 API 수집 스크립트
 *
 * API: 한국교통안전공단 주차정보 제공 API (B553881/Parking)
 * - PrkSttusInfo: 주차장 시설정보 (주차장명, 주소, 좌표, 주차면수)
 * - PrkOprInfo: 주차장 운영정보 (요일별 운영시간, 요금)
 *
 * 사용법:
 *   npx tsx scripts/fetch-parking.ts
 *   npx tsx scripts/fetch-parking.ts --resume    # 이어서 수집
 *   npx tsx scripts/fetch-parking.ts --pages 100 # 최대 100페이지만
 *
 * 특징:
 *   - 수집된 데이터를 페이지 단위로 누적 저장 (중간 중단 시 데이터 보존)
 *   - API 불안정 시 자동 재시도 (최대 5회)
 *   - --resume 옵션으로 이전 수집 이어서 진행
 *   - 수집 완료 후 주요 지역(서울/경기/부산/인천/대구/대전/광주) 우선 정렬
 */

import * as fs from 'fs';
import * as path from 'path';

// ─── API 설정 ───
const API_KEY =
  process.env.PARKING_API_KEY ||
  'Uf%2BvcObZtGOVPCYqlwkuyYH%2BdpfC1IYmOtFU8VGLu6LungpkbLuLteX8lkq1KDuSrJJafkiePqs1hjnFh85OjQ%3D%3D';

const API_BASE = 'http://apis.data.go.kr/B553881/Parking';
const ROWS_PER_PAGE = 1000;
const MAX_RETRIES = 5;
const RETRY_DELAY_MS = 5000;

// CLI 옵션
const args = process.argv.slice(2);
const RESUME_MODE = args.includes('--resume');
const MAX_PAGES_ARG = args.find((a) => a.startsWith('--pages'));
const MAX_PAGES = MAX_PAGES_ARG ? parseInt(args[args.indexOf('--pages') + 1], 10) : Infinity;

// ─── 타입 정의 ───
interface FacilityItem {
  prk_center_id: string;
  prk_plce_nm: string;
  prk_plce_adres: string;
  prk_plce_entrc_la: string;
  prk_plce_entrc_lo: string;
  prk_cmprt_co: string;
}

interface OperationItem {
  prk_center_id: string;
  Sunday?: { opertn_start_time: string; opertn_end_time: string };
  Monday?: { opertn_start_time: string; opertn_end_time: string };
  Saturday?: { opertn_start_time: string; opertn_end_time: string };
  Holiday?: { opertn_start_time: string; opertn_end_time: string };
  opertn_bs_free_time?: string;
  basic_info?: {
    parking_chrge_bs_time?: string;
    parking_chrge_bs_chrge?: string;
    parking_chrge_adit_unit_time?: string;
    parking_chrge_adit_unit_chrge?: string;
  };
  fxamt_info?: {
    parking_chrge_one_day_chrge?: string;
    parking_chrge_mon_unit_chrge?: string;
  };
}

// ─── 유틸리티 ───
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function formatTime(raw: string | undefined): string {
  if (!raw || raw.length < 4) return '';
  return `${raw.substring(0, 2)}:${raw.substring(2, 4)}`;
}

function parseInt0(val: string | undefined): number {
  if (!val) return 0;
  const n = parseInt(val, 10);
  return isNaN(n) ? 0 : n;
}

const SIDO_LIST = [
  '서울', '부산', '대구', '인천', '광주', '대전', '울산', '세종',
  '경기', '강원', '충북', '충남', '전북', '전남', '경북', '경남', '제주',
];

const FULL_NAME_MAP: Record<string, string> = {
  '서울특별시': '서울', '부산광역시': '부산', '대구광역시': '대구',
  '인천광역시': '인천', '광주광역시': '광주', '대전광역시': '대전',
  '울산광역시': '울산', '세종특별자치시': '세종', '경기도': '경기',
  '강원특별자치도': '강원', '강원도': '강원', '충청북도': '충북',
  '충청남도': '충남', '전라북도': '전북', '전북특별자치도': '전북',
  '전라남도': '전남', '경상북도': '경북', '경상남도': '경남',
  '제주특별자치도': '제주',
};

function extractSido(address: string): string {
  for (const sido of SIDO_LIST) {
    if (address.includes(sido)) return sido;
  }
  for (const [full, short] of Object.entries(FULL_NAME_MAP)) {
    if (address.startsWith(full)) return short;
  }
  return '';
}

function extractSigungu(address: string): string {
  const patterns = [
    /(?:특별시|광역시|특별자치시)\s+(\S+[구군])/,
    /(?:특별자치도|도)\s+(\S+[시군구])/,
  ];
  for (const p of patterns) {
    const m = address.match(p);
    if (m) return m[1];
  }
  return '';
}

// ─── 파일 경로 ───
const DATA_DIR = path.join(__dirname, '..', 'data');
const RAW_FACILITY_PATH = path.join(DATA_DIR, 'raw-facilities.json');
const RAW_OPERATION_PATH = path.join(DATA_DIR, 'raw-operations.json');
const PROGRESS_PATH = path.join(DATA_DIR, 'fetch-progress.json');
const OUTPUT_PATH = path.join(DATA_DIR, 'parking-lots.json');
const SAMPLE_PATH = path.join(DATA_DIR, 'parking-sample.json');

// ─── 진행 상태 관리 ───
interface Progress {
  facilityPage: number;
  facilityTotal: number;
  operationPage: number;
  operationTotal: number;
  facilityDone: boolean;
  operationDone: boolean;
}

function loadProgress(): Progress {
  if (RESUME_MODE && fs.existsSync(PROGRESS_PATH)) {
    return JSON.parse(fs.readFileSync(PROGRESS_PATH, 'utf-8'));
  }
  return {
    facilityPage: 0, facilityTotal: 0,
    operationPage: 0, operationTotal: 0,
    facilityDone: false, operationDone: false,
  };
}

function saveProgress(p: Progress) {
  fs.writeFileSync(PROGRESS_PATH, JSON.stringify(p, null, 2), 'utf-8');
}

// ─── API 호출 ───
async function fetchPage<T>(
  endpoint: string,
  dataKey: string,
  page: number
): Promise<{ items: T[]; totalCount: number } | null> {
  const url = `${API_BASE}/${endpoint}?serviceKey=${API_KEY}&numOfRows=${ROWS_PER_PAGE}&pageNo=${page}&format=2`;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 30000);

      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timeout);

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const text = await res.text();
      if (text.includes('<OpenAPI_ServiceResponse>') || text.includes('Error forwarding')) {
        throw new Error('API 서버 에러');
      }

      const data = JSON.parse(text);
      if (data.resultCode !== '0' && data.resultCode !== '00') {
        throw new Error(`resultCode: ${data.resultCode}`);
      }

      return {
        items: (data[dataKey] as T[]) || [],
        totalCount: parseInt0(data.totalCount),
      };
    } catch (err) {
      const msg = (err as Error).message;
      if (attempt < MAX_RETRIES) {
        const delay = RETRY_DELAY_MS * attempt;
        process.stdout.write(`  [${endpoint}] p${page} 재시도 ${attempt}/${MAX_RETRIES} (${msg}) ${delay/1000}s 대기...\n`);
        await sleep(delay);
      } else {
        console.error(`  [${endpoint}] p${page} 최종 실패: ${msg}`);
        return null; // 해당 페이지 스킵
      }
    }
  }
  return null;
}

// ─── 누적 수집 ───
async function collectAll<T>(
  endpoint: string,
  dataKey: string,
  rawPath: string,
  startPage: number,
  knownTotal: number
): Promise<{ items: T[]; lastPage: number; totalCount: number }> {
  // 기존 데이터 로드
  let allItems: T[] = [];
  if (RESUME_MODE && fs.existsSync(rawPath)) {
    allItems = JSON.parse(fs.readFileSync(rawPath, 'utf-8'));
    console.log(`  기존 데이터 ${allItems.length}건 로드`);
  }

  // 첫 페이지로 totalCount 확인
  let totalCount = knownTotal;
  const actualStart = startPage > 0 ? startPage + 1 : 1;

  if (totalCount === 0) {
    const first = await fetchPage<T>(endpoint, dataKey, 1);
    if (!first) {
      console.error(`  첫 페이지 수집 실패. 기존 데이터 사용.`);
      return { items: allItems, lastPage: startPage, totalCount: 0 };
    }
    totalCount = first.totalCount;
    allItems.push(...first.items);
  }

  const totalPages = Math.ceil(totalCount / ROWS_PER_PAGE);
  const effectiveMaxPage = Math.min(totalPages, MAX_PAGES);
  console.log(`  총 ${totalCount}건, ${totalPages}페이지 (최대 ${effectiveMaxPage}페이지 수집)`);

  let lastPage = startPage;
  let failCount = 0;
  const MAX_CONSECUTIVE_FAILS = 10;

  for (let page = actualStart; page <= effectiveMaxPage; page++) {
    process.stdout.write(`  [${endpoint}] ${page}/${effectiveMaxPage} 수집 중...  \r`);

    const result = await fetchPage<T>(endpoint, dataKey, page);
    if (result) {
      allItems.push(...result.items);
      lastPage = page;
      failCount = 0;

      // 50페이지마다 중간 저장
      if (page % 50 === 0) {
        fs.writeFileSync(rawPath, JSON.stringify(allItems), 'utf-8');
        console.log(`\n  중간 저장: ${allItems.length}건 (p${page}/${effectiveMaxPage})`);
      }
    } else {
      failCount++;
      if (failCount >= MAX_CONSECUTIVE_FAILS) {
        console.log(`\n  연속 ${MAX_CONSECUTIVE_FAILS}회 실패. 수집 중단.`);
        break;
      }
    }

    // rate limit
    await sleep(150);
  }

  // 최종 저장
  fs.writeFileSync(rawPath, JSON.stringify(allItems), 'utf-8');
  console.log(`\n  [${endpoint}] 수집 완료: ${allItems.length}건 (마지막 p${lastPage})`);

  return { items: allItems, lastPage, totalCount };
}

// ─── 데이터 변환 ───
function transformData(facilities: FacilityItem[], operations: OperationItem[]) {
  const oprMap = new Map<string, OperationItem>();
  for (const opr of operations) {
    oprMap.set(opr.prk_center_id, opr);
  }

  // 중복 제거 (prk_center_id 기준)
  const seen = new Set<string>();
  const uniqueFacilities = facilities.filter((f) => {
    if (seen.has(f.prk_center_id)) return false;
    seen.add(f.prk_center_id);
    return true;
  });

  console.log(`중복 제거: ${facilities.length} -> ${uniqueFacilities.length}건`);

  const parkingLots = uniqueFacilities
    .filter((f) => {
      const lat = parseFloat(f.prk_plce_entrc_la);
      const lng = parseFloat(f.prk_plce_entrc_lo);
      const address = f.prk_plce_adres || '';
      const sido = extractSido(address);
      return !isNaN(lat) && !isNaN(lng) && lat > 30 && lat < 40 && lng > 124 && lng < 132 && sido !== '' && f.prk_plce_nm;
    })
    .map((f) => {
      const opr = oprMap.get(f.prk_center_id);
      const address = f.prk_plce_adres || '';
      const sido = extractSido(address);
      const sigungu = extractSigungu(address);

      const weekdayOpen = formatTime(opr?.Monday?.opertn_start_time) || '00:00';
      const weekdayClose = formatTime(opr?.Monday?.opertn_end_time) || '23:59';
      const satOpen = formatTime(opr?.Saturday?.opertn_start_time) || weekdayOpen;
      const satClose = formatTime(opr?.Saturday?.opertn_end_time) || weekdayClose;
      const sunOpen = formatTime(opr?.Sunday?.opertn_start_time) || weekdayOpen;
      const sunClose = formatTime(opr?.Sunday?.opertn_end_time) || weekdayClose;

      const baseTime = parseInt0(opr?.basic_info?.parking_chrge_bs_time);
      const baseFee = parseInt0(opr?.basic_info?.parking_chrge_bs_chrge);
      const addTime = parseInt0(opr?.basic_info?.parking_chrge_adit_unit_time);
      const addFee = parseInt0(opr?.basic_info?.parking_chrge_adit_unit_chrge);
      const dailyMax = parseInt0(opr?.fxamt_info?.parking_chrge_one_day_chrge);
      const monthlyFee = parseInt0(opr?.fxamt_info?.parking_chrge_mon_unit_chrge);

      const isFree = baseFee === 0 && addFee === 0;

      const name = f.prk_plce_nm;
      let parkingType: '공영' | '민영' | '노외' | '노상' = '공영';
      if (name.includes('민영') || name.includes('민간')) parkingType = '민영';
      else if (name.includes('노상')) parkingType = '노상';
      else if (name.includes('노외')) parkingType = '노외';

      return {
        id: f.prk_center_id,
        name: f.prk_plce_nm,
        address,
        phone: '',
        sido,
        sigungu: sigungu || '기타',
        parkingType,
        operationType: isFree ? '무료' as const : '시간제' as const,
        capacity: parseInt0(f.prk_cmprt_co),
        weekdayOpen, weekdayClose,
        satOpen, satClose,
        sunOpen, sunClose,
        baseTime: baseTime || 30,
        baseFee,
        addTime: addTime || 10,
        addFee,
        dailyMax,
        monthlyFee,
        isFree,
        lat: parseFloat(f.prk_plce_entrc_la),
        lng: parseFloat(f.prk_plce_entrc_lo),
      };
    });

  // 주요 지역 우선 정렬
  const PRIORITY_ORDER = ['서울', '경기', '부산', '인천', '대구', '대전', '광주', '울산', '세종', '강원', '충북', '충남', '전북', '전남', '경북', '경남', '제주'];
  parkingLots.sort((a, b) => {
    const ai = PRIORITY_ORDER.indexOf(a.sido);
    const bi = PRIORITY_ORDER.indexOf(b.sido);
    if (ai !== bi) return ai - bi;
    return a.sigungu.localeCompare(b.sigungu);
  });

  return parkingLots;
}

// ─── 메인 ───
async function main() {
  console.log('=== 주차장 데이터 수집 ===');
  console.log(`모드: ${RESUME_MODE ? '이어서 수집' : '새로 수집'}`);
  console.log(`최대 페이지: ${MAX_PAGES === Infinity ? '전체' : MAX_PAGES}`);
  console.log(`시간: ${new Date().toISOString()}\n`);

  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  const progress = loadProgress();

  // 1. 시설정보 수집
  if (!progress.facilityDone) {
    console.log('[1/2] 시설정보 수집');
    const result = await collectAll<FacilityItem>(
      'PrkSttusInfo', 'PrkSttusInfo', RAW_FACILITY_PATH,
      progress.facilityPage, progress.facilityTotal
    );
    progress.facilityPage = result.lastPage;
    progress.facilityTotal = result.totalCount;
    if (result.lastPage >= Math.min(Math.ceil(result.totalCount / ROWS_PER_PAGE), MAX_PAGES)) {
      progress.facilityDone = true;
    }
    saveProgress(progress);
  } else {
    console.log('[1/2] 시설정보: 이미 수집 완료');
  }

  // 2. 운영정보 수집
  if (!progress.operationDone) {
    console.log('\n[2/2] 운영정보 수집');
    const result = await collectAll<OperationItem>(
      'PrkOprInfo', 'PrkOprInfo', RAW_OPERATION_PATH,
      progress.operationPage, progress.operationTotal
    );
    progress.operationPage = result.lastPage;
    progress.operationTotal = result.totalCount;
    if (result.lastPage >= Math.min(Math.ceil(result.totalCount / ROWS_PER_PAGE), MAX_PAGES)) {
      progress.operationDone = true;
    }
    saveProgress(progress);
  } else {
    console.log('[2/2] 운영정보: 이미 수집 완료');
  }

  // 3. 데이터 변환
  console.log('\n[변환] 데이터 병합 및 변환...');
  const facilities: FacilityItem[] = fs.existsSync(RAW_FACILITY_PATH)
    ? JSON.parse(fs.readFileSync(RAW_FACILITY_PATH, 'utf-8'))
    : [];
  const operations: OperationItem[] = fs.existsSync(RAW_OPERATION_PATH)
    ? JSON.parse(fs.readFileSync(RAW_OPERATION_PATH, 'utf-8'))
    : [];

  const parkingLots = transformData(facilities, operations);

  // 4. 통계
  const sidoStats = new Map<string, number>();
  for (const lot of parkingLots) {
    sidoStats.set(lot.sido, (sidoStats.get(lot.sido) || 0) + 1);
  }

  console.log('\n=== 시도별 주차장 수 ===');
  for (const [sido, count] of [...sidoStats.entries()].sort((a, b) => b[1] - a[1])) {
    console.log(`  ${sido}: ${count.toLocaleString()}개`);
  }

  const freeCount = parkingLots.filter((l) => l.isFree).length;
  console.log(`\n전체: ${parkingLots.length.toLocaleString()}개 (무료: ${freeCount.toLocaleString()}개)`);

  // 5. 저장
  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(parkingLots, null, 2), 'utf-8');
  fs.writeFileSync(SAMPLE_PATH, JSON.stringify(parkingLots, null, 2), 'utf-8');

  const fileSize = (fs.statSync(OUTPUT_PATH).size / 1024 / 1024).toFixed(2);
  console.log(`\n저장: ${OUTPUT_PATH} (${fileSize} MB)`);

  if (!progress.facilityDone || !progress.operationDone) {
    console.log('\n⚠️  수집이 완료되지 않았습니다. 다음 명령으로 이어서 수집하세요:');
    console.log('   npx tsx scripts/fetch-parking.ts --resume');
  }

  console.log('\n=== 완료 ===');
}

main().catch((error) => {
  console.error('\n=== 에러 ===', error);
  process.exit(1);
});
