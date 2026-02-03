/**
 * DTO for channel responses to the frontend.
 * Masks sensitive fields like streamUrl and sourceUrl.
 */
export class ChannelResponseDto {
  id: string;
  tvgName: string;
  tvgLogo: string;
  groupTitle: string;
  createdAt: Date;
  updatedAt: Date;

  constructor(channel: {
    id: string;
    tvgName: string;
    tvgLogo: string;
    groupTitle: string;
    createdAt: Date;
    updatedAt: Date;
  }) {
    this.id = channel.id;
    this.tvgName = channel.tvgName;
    this.tvgLogo = channel.tvgLogo;
    this.groupTitle = channel.groupTitle;
    this.createdAt = channel.createdAt;
    this.updatedAt = channel.updatedAt;
  }
}
