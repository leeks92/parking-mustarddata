/**
 * 랜드마크 근처 주차장 블로그 포스트 자동 생성
 * mustarddata.com Jekyll 블로그용
 *
 * 사용법: npx tsx scripts/generate-blog-posts.ts
 */

import * as fs from 'fs';
import * as path from 'path';

const BLOG_DIR = '/Users/nhn/mustarddata/_posts/2026/02';
const DATA_PATH = path.join(__dirname, '..', 'data', 'landmark-parking.json');
const DATE = '2026-02-11';
const MIN_TOTAL = 5;

interface LotInfo {
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

interface LandmarkData {
  landmark: {
    name: string;
    slug: string;
    lat: number;
    lng: number;
    category: string;
    description: string;
  };
  total: number;
  free: number;
  paid: number;
  public: number;
  avgBaseFee: number;
  avgAddFee: number;
  avgDailyMax: number;
  topFree: LotInfo[];
  topPublic: LotInfo[];
  cheapest: LotInfo[];
}

function formatFee(fee: number): string {
  return fee.toLocaleString() + '원';
}

function generatePost(data: LandmarkData): string {
  const lm = data.landmark;
  const hasFreeLots = data.free > 0;
  const hasPaidLots = data.paid > 0;
  const freeRatio = data.total > 0 ? Math.round((data.free / data.total) * 100) : 0;

  // 제목 생성
  const title = `${lm.name} 근처 주차장 요금 비교 - 무료·공영 주차장 총정리 (2026)`;
  const excerpt = `${lm.name} 근처 주차장 ${data.total}곳의 요금과 위치를 비교합니다. 무료 주차장 ${data.free}곳, 공영 주차장 ${data.public}곳의 운영시간과 요금 정보를 한눈에 확인하세요.`;

  let post = `---
layout: single
title: "${title}"
date: ${DATE}
last_modified_at: ${DATE}T12:00:00+09:00
categories:
  - parking
tags:
  - 주차장
  - ${lm.name}
  - 주차요금
  - 무료주차장
  - 공영주차장
author: Daniel
excerpt: "${excerpt}"
toc: true
toc_sticky: true
toc_label: "목차"
---

## ${lm.name} 근처 주차장 현황

${lm.name}(${lm.description}) 반경 1km 이내에는 **총 ${data.total}곳**의 주차장이 있습니다.

| 구분 | 수량 |
|------|------|
| 전체 주차장 | **${data.total}곳** |
| 무료 주차장 | ${data.free}곳 (${freeRatio}%) |
| 유료 주차장 | ${data.paid}곳 |
| 공영 주차장 | ${data.public}곳 |

`;

  if (hasPaidLots && data.avgBaseFee > 0) {
    post += `### ${lm.name} 주차장 평균 요금

| 항목 | 금액 |
|------|------|
| 평균 기본요금 | **${formatFee(data.avgBaseFee)}** |
| 평균 추가요금 | ${formatFee(data.avgAddFee)} |
${data.avgDailyMax > 0 ? `| 평균 일 최대요금 | ${formatFee(data.avgDailyMax)} |\n` : ''}
> 기본요금은 최초 주차 시간(보통 30분)에 대한 요금이며, 이후 추가 시간(보통 10분)당 추가요금이 부과됩니다.

`;
  }

  // 무료 주차장 섹션
  if (hasFreeLots && data.topFree.length > 0) {
    post += `## ${lm.name} 근처 무료 주차장

${lm.name} 주변에는 **${data.free}곳의 무료 주차장**이 있습니다.${data.free > 5 ? ` 가장 가까운 ${data.topFree.length}곳을 소개합니다.` : ''}

| 주차장명 | 주소 | ${data.topFree[0]?.capacity ? '수용대수 | ' : ''}거리 |
|----------|------|${data.topFree[0]?.capacity ? '---------|' : ''}------|
`;
    for (const lot of data.topFree) {
      const cap = lot.capacity ? `${lot.capacity}대 | ` : '';
      post += `| ${lot.name} | ${lot.address} | ${cap}${lot.distance}m |\n`;
    }

    post += `
> 무료 주차장은 주말이나 공휴일에 혼잡할 수 있으므로 여유 있게 도착하는 것을 추천합니다.

`;
  }

  // 공영 주차장 섹션
  if (data.topPublic.length > 0) {
    post += `## ${lm.name} 근처 공영 주차장 요금

공영 주차장은 지방자치단체가 운영하여 민영 주차장보다 요금이 저렴한 편입니다.

| 주차장명 | 기본요금 | 추가요금 | ${data.topPublic.some(l => l.dailyMax && l.dailyMax > 0) ? '일 최대 | ' : ''}거리 |
|----------|----------|----------|${data.topPublic.some(l => l.dailyMax && l.dailyMax > 0) ? '---------|' : ''}------|
`;
    for (const lot of data.topPublic) {
      const daily = lot.dailyMax && lot.dailyMax > 0 ? `${formatFee(lot.dailyMax)} | ` : (data.topPublic.some(l => l.dailyMax && l.dailyMax > 0) ? '- | ' : '');
      post += `| ${lot.name} | ${formatFee(lot.baseFee || 0)}/${lot.baseTime || 30}분 | ${formatFee(lot.addFee || 0)}/${lot.addTime || 10}분 | ${daily}${lot.distance}m |\n`;
    }
    post += '\n';
  }

  // 저렴한 주차장 섹션
  if (data.cheapest.length > 0) {
    post += `## ${lm.name} 근처 저렴한 주차장 TOP ${data.cheapest.length}

요금이 가장 저렴한 유료 주차장을 정리했습니다.

| 순위 | 주차장명 | 유형 | 기본요금 | 추가요금 | ${data.cheapest.some(l => l.dailyMax && l.dailyMax > 0) ? '일 최대 | ' : ''}거리 |
|------|----------|------|----------|----------|${data.cheapest.some(l => l.dailyMax && l.dailyMax > 0) ? '---------|' : ''}------|
`;
    data.cheapest.forEach((lot, i) => {
      const daily = lot.dailyMax && lot.dailyMax > 0 ? `${formatFee(lot.dailyMax)} | ` : (data.cheapest.some(l => l.dailyMax && l.dailyMax > 0) ? '- | ' : '');
      post += `| ${i + 1} | ${lot.name} | ${lot.parkingType} | ${formatFee(lot.baseFee || 0)}/${lot.baseTime || 30}분 | ${formatFee(lot.addFee || 0)}/${lot.addTime || 10}분 | ${daily}${lot.distance}m |\n`;
    });
    post += '\n';
  }

  // 주차 요금 절약 팁
  post += `## ${lm.name} 주차 요금 절약 팁

1. **무료 주차장 우선 확인**: ${lm.name} 근처에는 ${data.free}곳의 무료 주차장이 있습니다. 조금 걸어야 하더라도 무료 주차장을 이용하면 비용을 크게 절약할 수 있습니다.
2. **공영 주차장 이용**: 공영 주차장은 민영보다 평균 30~50% 저렴합니다.
3. **일 최대 요금 확인**: 장시간 주차 시에는 일 최대 요금이 설정된 주차장을 선택하면 예상치 못한 요금 폭탄을 피할 수 있습니다.
4. **주말·공휴일 요금 확인**: 일부 공영 주차장은 주말에 무료 또는 할인 요금을 적용합니다.
5. **대중교통 병행**: 주차비가 부담된다면 외곽 무료 주차장에 주차 후 대중교통으로 이동하는 것도 좋은 방법입니다.

`;

  // FAQ
  post += `## 자주 묻는 질문

### ${lm.name} 근처 주차장 요금은 얼마인가요?

${lm.name} 근처 유료 주차장의 평균 기본요금은 **${data.avgBaseFee > 0 ? formatFee(data.avgBaseFee) : '무료 주차장 위주'}**입니다. ${data.cheapest.length > 0 ? `가장 저렴한 주차장은 ${data.cheapest[0].name}으로 ${formatFee(data.cheapest[0].baseFee || 0)}/${data.cheapest[0].baseTime || 30}분입니다.` : ''}

### ${lm.name} 근처에 무료 주차장이 있나요?

네, ${lm.name} 반경 1km 이내에 **${data.free}곳의 무료 주차장**이 있습니다.${data.topFree.length > 0 ? ` 가장 가까운 무료 주차장은 ${data.topFree[0].name}(${data.topFree[0].distance}m)입니다.` : ''}

### ${lm.name} 근처 공영 주차장은 몇 곳인가요?

${lm.name} 반경 1km 이내에 **${data.public}곳의 공영 주차장**이 있습니다. 공영 주차장은 지자체가 운영하여 민영 주차장보다 요금이 저렴합니다.

`;

  // CTA
  post += `## 더 많은 주차장 정보

위 정보는 한국교통안전공단 데이터를 기반으로 작성되었습니다. ${lm.name} 근처의 **더 상세한 주차장 정보와 실시간 요금 비교**는 아래 사이트에서 확인할 수 있습니다.

- [전국 주차장 검색 및 요금 비교 - parking.mustarddata.com](https://parking.mustarddata.com)
- [무료 주차장 찾기](https://parking.mustarddata.com/free/)
- [주차 요금 비교하기](https://parking.mustarddata.com/compare/)
`;

  return post;
}

function main() {
  const data: Record<string, LandmarkData> = JSON.parse(fs.readFileSync(DATA_PATH, 'utf-8'));

  if (!fs.existsSync(BLOG_DIR)) {
    fs.mkdirSync(BLOG_DIR, { recursive: true });
  }

  let count = 0;
  for (const [slug, lmData] of Object.entries(data)) {
    if (lmData.total < MIN_TOTAL) continue;

    const filename = `${DATE}-parking-near-${slug}.md`;
    const filepath = path.join(BLOG_DIR, filename);
    const content = generatePost(lmData);
    fs.writeFileSync(filepath, content, 'utf-8');
    count++;
    console.log(`[${count}] ${lmData.landmark.name} → ${filename}`);
  }

  console.log(`\n총 ${count}개 포스트 생성 완료: ${BLOG_DIR}`);
}

main();
