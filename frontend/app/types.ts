export interface ActiveQuadrant {
  quadrant: number;
  channelId: string;
  channelName?: string;
  channelLogo?: string;
}

export interface Device {
  id: string;
  deviceCode: string;
  nickname: string | null;
  layoutMode: "single" | "quad";
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
  streamUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ImportResult {
  /** New channels created. */
  count: number;
  created: number;
  /** Existing channels whose metadata was refreshed from the playlist. */
  updated: number;
  unchanged: number;
  /** Distinct stream URLs found in the playlist. */
  total: number;
}

export type M3uSourceStatus = "pending" | "success" | "error";

export interface M3uSource {
  id: string;
  url: string;
  autoRefresh: boolean;
  refreshIntervalMinutes: number;
  lastSyncedAt: string | null;
  lastStatus: M3uSourceStatus;
  lastError: string | null;
  lastCreatedCount: number;
  lastUpdatedCount: number;
  lastChannelCount: number;
  userId: string;
  createdAt: string;
  updatedAt: string;
}
