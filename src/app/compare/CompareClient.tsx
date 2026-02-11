'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { ParkingLot } from '@/lib/types';

interface CompareClientProps {
  allLots: ParkingLot[];
  regions: string[];
}

function calculateFeeClient(lot: ParkingLot, minutes: number): number {
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

export default function CompareClient({ allLots, regions }: CompareClientProps) {
  const [minutes, setMinutes] = useState(60);
  const [selectedRegion, setSelectedRegion] = useState('전체');
  const [sortBy, setSortBy] = useState<'fee' | 'capacity'>('fee');

  const quickTimes = [30, 60, 120, 180, 360, 720];

  const filteredLots = allLots
    .filter((lot) => {
      if (selectedRegion !== '전체' && lot.sido !== selectedRegion) return false;
      return true;
    })
    .map((lot) => ({
      ...lot,
      calculatedFee: calculateFeeClient(lot, minutes),
    }))
    .sort((a, b) => {
      if (sortBy === 'fee') return a.calculatedFee - b.calculatedFee;
      return b.capacity - a.capacity;
    });

  return (
    <div>
      {/* 입력 영역 */}
      <div className="calculator-card mb-8">
        <h2 className="text-lg font-bold text-gray-900 mb-4">주차 조건 설정</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="calculator-label">주차 시간 (분)</label>
            <input
              type="number"
              className="calculator-input"
              value={minutes}
              onChange={(e) => setMinutes(Number(e.target.value))}
              min={0}
              max={1440}
            />
          </div>
          <div>
            <label className="calculator-label">지역 선택</label>
            <select
              className="calculator-input"
              value={selectedRegion}
              onChange={(e) => setSelectedRegion(e.target.value)}
            >
              <option value="전체">전체</option>
              {regions.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-4">
          {quickTimes.map((t) => (
            <button
              key={t}
              onClick={() => setMinutes(t)}
              className={`quick-btn ${minutes === t ? 'active' : ''}`}
            >
              {t >= 60 ? `${t / 60}시간` : `${t}분`}
            </button>
          ))}
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setSortBy('fee')}
            className={`quick-btn ${sortBy === 'fee' ? 'active' : ''}`}
          >
            요금순
          </button>
          <button
            onClick={() => setSortBy('capacity')}
            className={`quick-btn ${sortBy === 'capacity' ? 'active' : ''}`}
          >
            규모순
          </button>
        </div>
      </div>

      {/* 결과 */}
      <div className="mb-4 text-sm text-gray-500">
        {filteredLots.length}개 주차장 ·{' '}
        {minutes >= 60
          ? `${Math.floor(minutes / 60)}시간 ${minutes % 60 > 0 ? `${minutes % 60}분` : ''}`
          : `${minutes}분`}{' '}
        주차 기준
      </div>

      <div className="space-y-3">
        {filteredLots.map((lot, index) => (
          <Link
            key={lot.id}
            href={`/parking/${lot.id}`}
            className="block bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-lg hover:border-indigo-200 transition-all"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-bold text-indigo-600 w-8">{index + 1}</span>
                  <h3 className="font-bold text-gray-900">{lot.name}</h3>
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                    lot.parkingType === '공영' ? 'bg-blue-100 text-blue-700' :
                    lot.parkingType === '민영' ? 'bg-orange-100 text-orange-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {lot.parkingType}
                  </span>
                  {lot.isFree && (
                    <span className="px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700">무료</span>
                  )}
                </div>
                <p className="text-sm text-gray-500 pl-8">{lot.address}</p>
              </div>
              <div className="text-right shrink-0 ml-4">
                <p className="text-xl font-extrabold text-indigo-600">
                  {lot.isFree ? '무료' : `${lot.calculatedFee.toLocaleString()}원`}
                </p>
                <p className="text-xs text-gray-400">{lot.capacity}면</p>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {filteredLots.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <p>조건에 맞는 주차장이 없습니다.</p>
        </div>
      )}
    </div>
  );
}
