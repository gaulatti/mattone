import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('channels')
export class Channel {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tvg_name', nullable: true })
  tvgName: string;

  @Column({ name: 'tvg_logo', type: 'text', nullable: true })
  tvgLogo: string;

  @Column({ name: 'group_title', nullable: true })
  @Index('idx_channels_group_title')
  groupTitle: string;

  @Column({ name: 'stream_url', type: 'text', nullable: false })
  streamUrl: string;

  @Column({ name: 'source_url', type: 'text', nullable: false })
  sourceUrl: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
