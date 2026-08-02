import { Column, CreateDateColumn, Entity, Index, ManyToOne, PrimaryGeneratedColumn, JoinColumn } from 'typeorm';
import { Channel } from './channel.entity';

@Entity('channel_reliability_events')
export class ChannelReliabilityEvent {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column({ name: 'channel_id', type: 'uuid' }) @Index() channelId: string;
  @ManyToOne(() => Channel, { onDelete: 'CASCADE' }) @JoinColumn({ name: 'channel_id' }) channel: Channel;
  @Column({ type: 'varchar', length: 16 }) status: 'green' | 'warning' | 'blocked';
  @Column({ name: 'device_code', nullable: true }) deviceCode?: string;
  @Column({ name: 'error_code', nullable: true }) errorCode?: string;
  @Column({ name: 'reason', type: 'text', nullable: true }) reason?: string;
  @CreateDateColumn({ name: 'created_at' }) createdAt: Date;
}
