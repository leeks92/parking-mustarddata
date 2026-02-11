'use client';

import { useState } from 'react';
import type { ParkingLot } from '@/lib/types';

interface FeeCalculatorProps {
  lot: ParkingLot;
}

export default function FeeCalculator({ lot }: FeeCalculatorProps) {
  const [minutes, setMinutes] = useState(60);

  const calculateFee = (mins: number): number => {
    if (lot.isFree || mins <= 0) return 0;
    if (lot.baseTime === 0) return 0;

    let fee = 0;
    if (mins <= lot.baseTime) {
      fee = lot.baseFee;
    } else {
      fee = lot.baseFee;
      const remainingMinutes = mins - lot.baseTime;
      if (lot.addTime > 0) {
        fee += Math.ceil(remainingMinutes / lot.addTime) * lot.addFee;
      }
    }

    if (lot.dailyMax > 0) {
      fee = Math.min(fee, lot.dailyMax);
    }

    return fee;
  };

  const fee = calculateFee(minutes);
  const quickTimes = [30, 60, 120, 180, 360, 720];

  return (
    <div className="calculator-card">
      <h3 className="text-lg font-bold text-gray-900 mb-4">주차 요금 계산기</h3>

      {lot.isFree ? (
        <div className="result-card text-center py-6">
          <p className="result-label mb-2">이 주차장은</p>
          <p className="text-3xl font-extrabold text-green-700">무료</p>
          <p className="text-sm text-green-600 mt-2">주차 요금이 부과되지 않습니다</p>
        </div>
      ) : (
        <>
          <div className="mb-4">
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

          <div className="flex flex-wrap gap-2 mb-6">
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

          <div className="result-card">
            <div className="text-center">
              <p className="result-label mb-1">
                {minutes >= 60
                  ? `${Math.floor(minutes / 60)}시간 ${minutes % 60 > 0 ? `${minutes % 60}분` : ''}`
                  : `${minutes}분`}{' '}
                주차 시
              </p>
              <p className="result-value">{fee.toLocaleString()}원</p>
            </div>
            {lot.dailyMax > 0 && (
              <p className="text-sm text-center mt-3 text-indigo-600">
                일 최대 요금: {lot.dailyMax.toLocaleString()}원
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
