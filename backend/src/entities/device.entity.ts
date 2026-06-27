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

export interface ActiveQuadrant {
  quadrant: number;
  channelId: string;
}

@Entity('devices')
export class Device {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'device_code', unique: true, nullable: false })
  @Index('idx_devices_device_code', { unique: true })
  deviceCode: string;

  @Column({ name: 'user_id', type: 'uuid', nullable: false })
  @Index('idx_devices_user_id')
  userId: string;

  @ManyToOne(() => User, (user) => user.devices, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'active_channel_id', type: 'uuid', nullable: true })
  activeChannelId: string | null;

  @Column({
    name: 'layout_mode',
    type: 'enum',
    enum: ['single', 'quad'],
    default: 'single',
  })
  layoutMode: 'single' | 'quad';

  @Column({
    name: 'active_quadrants',
    type: 'jsonb',
    default: () => "'[]'",
  })
  activeQuadrants: ActiveQuadrant[];

  @Column({ name: 'nickname', nullable: true, type: 'varchar' })
  nickname: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
