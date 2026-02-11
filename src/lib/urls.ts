export const BASE_URL = 'https://parking.mustarddata.com';

export const MAIN_PAGES = [
  {
    path: '/free',
    title: '무료 주차장',
    description: '전국 무료 주차장 위치와 운영시간을 확인하세요.',
    emoji: '🆓',
  },
  {
    path: '/compare',
    title: '주차 요금 비교',
    description: '주차 시간을 입력하면 주변 주차장 요금을 한눈에 비교합니다.',
    emoji: '💰',
  },
  {
    path: '/near',
    title: '근처 주차장',
    description: '주요 장소 근처 공영·무료 주차장을 찾아보세요.',
    emoji: '📍',
  },
];

export const REGION_PAGES = [
  { path: '/region/seoul', title: '서울 주차장', description: '서울특별시 주차장 현황', emoji: '🅿️' },
  { path: '/region/gyeonggi', title: '경기 주차장', description: '경기도 주차장 현황', emoji: '🅿️' },
  { path: '/region/busan', title: '부산 주차장', description: '부산광역시 주차장 현황', emoji: '🅿️' },
];

export function getAllUrls(): string[] {
  return [
    BASE_URL,
    ...MAIN_PAGES.map((page) => `${BASE_URL}${page.path}`),
    ...REGION_PAGES.map((page) => `${BASE_URL}${page.path}`),
  ];
}
