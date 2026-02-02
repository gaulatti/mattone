import type { Device, Channel, ImportResult } from './types';

export const mockDevices: Device[] = [
  {
    id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    deviceCode: 'X4K7N9P2QR',
    userId: 'user-1',
    createdAt: '2023-10-01T10:00:00Z',
    updatedAt: '2023-10-01T10:00:00Z'
  },
  {
    id: 'a12bc21d-48dd-5483-b678-1f13c3d4e580',
    deviceCode: 'L9M2N3P4Q5',
    userId: 'user-1',
    createdAt: '2023-10-02T11:30:00Z',
    updatedAt: '2023-10-02T11:30:00Z'
  },
  {
    id: 'b23cd32e-59ee-6594-c789-2g24d4e5f691',
    deviceCode: 'R8S1T2U3V4',
    userId: 'user-1',
    createdAt: '2023-10-03T14:15:00Z',
    updatedAt: '2023-10-03T14:15:00Z'
  }
];

export const mockChannels: Channel[] = [
  {
    id: 'c1',
    tvgName: 'TNT SPORTS EN MAX HD',
    tvgLogo: 'https://example.com/logo-tntjs.png',
    groupTitle: 'FUTBOL CHILENO',
    streamUrl: 'http://example.com/stream1',
    sourceUrl: 'http://example.com/m3u',
    createdAt: '2023-10-05T08:00:00Z',
    updatedAt: '2023-10-05T08:00:00Z'
  },
  {
    id: 'c2',
    tvgName: 'DISCOVERY TURBO HD',
    tvgLogo: '',
    groupTitle: 'CULTURA',
    streamUrl: 'http://example.com/stream2',
    sourceUrl: 'http://example.com/m3u',
    createdAt: '2023-10-05T08:00:00Z',
    updatedAt: '2023-10-05T08:00:00Z'
  },
  {
    id: 'c3',
    tvgName: 'Music Choice SOUL',
    tvgLogo: 'https://example.com/logo-mc.png',
    groupTitle: 'MUSICA',
    streamUrl: 'http://example.com/stream3',
    sourceUrl: 'http://example.com/m3u',
    createdAt: '2023-10-05T08:00:00Z',
    updatedAt: '2023-10-05T08:00:00Z'
  },
  {
    id: 'c4',
    tvgName: '24 HRS Rick y Morty',
    tvgLogo: '',
    groupTitle: 'CANALES 24 HRS',
    streamUrl: 'http://example.com/stream4',
    sourceUrl: 'http://example.com/m3u',
    createdAt: '2023-10-05T08:00:00Z',
    updatedAt: '2023-10-05T08:00:00Z'
  },
  {
    id: 'c5',
    tvgName: 'BAILABLES 1',
    tvgLogo: 'https://example.com/logo-bailables.png',
    groupTitle: 'BAILABLES STREAMID',
    streamUrl: 'http://example.com/stream5',
    sourceUrl: 'http://example.com/m3u',
    createdAt: '2023-10-05T08:00:00Z',
    updatedAt: '2023-10-05T08:00:00Z'
  },
  {
    id: 'c6',
    tvgName: 'BAILABLES 2',
    tvgLogo: '',
    groupTitle: 'BAILABLES STREAMID',
    streamUrl: 'http://example.com/stream6',
    sourceUrl: 'http://example.com/m3u',
    createdAt: '2023-10-05T08:00:00Z',
    updatedAt: '2023-10-05T08:00:00Z'
  },
  {
    id: 'c7',
    tvgName: 'History Channel',
    tvgLogo: 'https://example.com/logo-history.png',
    groupTitle: 'CULTURA',
    streamUrl: 'http://example.com/stream7',
    sourceUrl: 'http://example.com/m3u',
    createdAt: '2023-10-05T08:00:00Z',
    updatedAt: '2023-10-05T08:00:00Z'
  },
  {
    id: 'c8',
    tvgName: 'MTV Hits',
    tvgLogo: 'https://example.com/logo-mtv.png',
    groupTitle: 'MUSICA',
    streamUrl: 'http://example.com/stream8',
    sourceUrl: 'http://example.com/m3u',
    createdAt: '2023-10-05T08:00:00Z',
    updatedAt: '2023-10-05T08:00:00Z'
  },
  {
    id: 'c9',
    tvgName: 'Canal 13',
    tvgLogo: '',
    groupTitle: 'FUTBOL CHILENO',
    streamUrl: 'http://example.com/stream9',
    sourceUrl: 'http://example.com/m3u',
    createdAt: '2023-10-05T08:00:00Z',
    updatedAt: '2023-10-05T08:00:00Z'
  },
  {
    id: 'c10',
    tvgName: '24 HRS Los Simpsons',
    tvgLogo: 'https://example.com/logo-simpsons.png',
    groupTitle: 'CANALES 24 HRS',
    streamUrl: 'http://example.com/stream10',
    sourceUrl: 'http://example.com/m3u',
    createdAt: '2023-10-05T08:00:00Z',
    updatedAt: '2023-10-05T08:00:00Z'
  }
];

export const mockImportResult: ImportResult = {
  count: 247
};
