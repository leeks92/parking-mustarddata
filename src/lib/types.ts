export interface ParkingLot {
  id: string;
  name: string;
  address: string;
  phone: string;
  sido: string;
  sigungu: string;
  parkingType: '공영' | '민영' | '노외' | '노상';
  operationType: '시간제' | '월정액' | '무료';
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

export interface Region {
  sido: string;
  sidoCode: string;
  sigungu: Sigungu[];
}

export interface Sigungu {
  name: string;
  code: string;
  parkingCount: number;
}
