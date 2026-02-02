export interface Device {
  id: string;
  deviceCode: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Channel {
  id: string;
  tvgName: string;
  tvgLogo: string;
  groupTitle: string;
  streamUrl: string;
  sourceUrl: string;
  createdAt: string;
  updatedAt: string;
}

export interface ImportResult {
  count: number;
}
