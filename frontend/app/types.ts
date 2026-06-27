export interface ActiveQuadrant {
  quadrant: number;
  channelId: string;
}

export interface Device {
  id: string;
  deviceCode: string;
  nickname: string | null;
  layoutMode: 'single' | 'quad';
  activeChannelId: string | null;
  activeQuadrants: ActiveQuadrant[];
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface ChannelGroup {
  id: string;
  name: string;
  userId: string;
  channels: Channel[];
  createdAt: string;
  updatedAt: string;
}

export interface Channel {
  id: string;
  tvgName: string;
  tvgLogo: string;
  groupTitle: string;
  createdAt: string;
  updatedAt: string;
}

export interface ImportResult {
  count: number;
}
