import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, UpdateDateColumn, JoinColumn } from 'typeorm';
import { User } from './User';
import { Investment } from './Investment';
import { Transaction } from './Transaction';
import { Support } from './Support';
import { AdminInvite } from './AdminInvite';

@Entity('notifications')
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @ManyToOne(() => Investment, { nullable: true })
  @JoinColumn({ name: 'investment_id' })
  investment!: Investment;

  @ManyToOne(() => Transaction, { nullable: true })
  @JoinColumn({ name: 'transaction_id' })
  transaction!: Transaction;

  @ManyToOne(() => Support, { nullable: true })
  @JoinColumn({ name: 'support_id' })
  support!: Support;

  @ManyToOne(() => AdminInvite, { nullable: true })
  @JoinColumn({ name: 'admin_invite_id' })
  adminInvite!: AdminInvite;

  @Column({
    type: 'enum',
    enum: ['investment', 'withdrawal', 'referral', 'system', 'transaction', 'support', 'profile'],
    default: 'system'
  })
  type!: string;

  @Column()
  title!: string;

  @Column('text')
  message!: string;

  @Column({ nullable: true })
  referenceId!: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata!: Record<string, any>;

  @Column({ default: false })
  read!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
