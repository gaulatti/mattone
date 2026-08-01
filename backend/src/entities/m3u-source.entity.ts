import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';

export type M3uSourceStatus = 'pending' | 'success' | 'error';

/**
 * An M3U playlist the user imported from a URL and that can be re-fetched
 * periodically to keep channel metadata up to date.
 */
@Entity('m3u_sources')
@Index('idx_m3u_sources_user_url', ['userId', 'url'], { unique: true })
export class M3uSource {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', type: 'uuid', nullable: false })
  @Index('idx_m3u_sources_user_id')
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'url', type: 'text', nullable: false })
  url: string;

  @Column({ name: 'auto_refresh', type: 'boolean', default: true })
  autoRefresh: boolean;

  @Column({ name: 'refresh_interval_minutes', type: 'int', default: 1440 })
  refreshIntervalMinutes: number;

  @Column({ name: 'last_synced_at', type: 'timestamptz', nullable: true })
  lastSyncedAt: Date | null;

  @Column({ name: 'last_status', type: 'varchar', default: 'pending' })
  lastStatus: M3uSourceStatus;

  @Column({ name: 'last_error', type: 'text', nullable: true })
  lastError: string | null;

  @Column({ name: 'last_created_count', type: 'int', default: 0 })
  lastCreatedCount: number;

  @Column({ name: 'last_updated_count', type: 'int', default: 0 })
  lastUpdatedCount: number;

  @Column({ name: 'last_channel_count', type: 'int', default: 0 })
  lastChannelCount: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
