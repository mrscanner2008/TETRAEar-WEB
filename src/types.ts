export type BurstType = 'Normal' | 'Sync' | 'Access' | 'Control';
export type ChannelType = 'MCCH' | 'SCCH' | 'PDCH' | 'TCH';

export interface TetraFrame {
  id: string;
  timestamp: number;
  frequency: number;
  burstType: BurstType;
  channelType: ChannelType;
  ssi: number;
  gssi: number;
  payload: string;
  crc: boolean;
  encrypted: boolean;
  decrypted: boolean;
}

export interface Call {
  id: string;
  startTime: number;
  endTime?: number;
  caller: number;
  target: number;
  group: number;
  type: 'Voice' | 'Data';
  status: 'Active' | 'Ended';
  amplitude: number[];
}

export interface SystemStats {
  syncRate: number;
  crcSuccess: number;
  signalStrength: number;
  noiseFloor: number;
  framesPerSecond: number;
}
