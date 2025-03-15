import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, OneToMany } from "typeorm";
import { User } from "./User";
import { Notification } from './Notification';

@Entity("investments")
export class Investment {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @ManyToOne(() => User, user => user.investments)
  @JoinColumn({ name: "user_id" })
  user!: User;

  @Column({ type: "decimal", precision: 10, scale: 2 })
  amount!: number;

  @Column({
    type: "enum",
    enum: [30, 60, 90, 180]
  })
  duration!: 30 | 60 | 90 | 180;

  @Column({
    type: "enum",
    enum: [0.25, 0.50, 1.00, 2.00]
  })
  returnRate!: 0.25 | 0.50 | 1.00 | 2.00;

  @Column()
  startDate!: Date;

  @Column()
  endDate!: Date;

  @Column({
    type: "enum",
    enum: ["active", "completed", "cancelled"],
    default: "active"
  })
  status!: "active" | "completed" | "cancelled";

  @Column({ type: "decimal", precision: 10, scale: 2 })
  totalReturn!: number;

  @Column({ unique: true })
  reference!: string;

  @Column('json')
  rewards!: {
    baseRate: number;
    compoundRate: number;
    totalReward: number;
    lastCalculated: Date;
  };

  @Column({ type: "timestamp" })
  stakingStartDate!: Date;

  @Column({ type: "timestamp" })
  stakingEndDate!: Date;

  @OneToMany(() => Notification, (notification: Notification) => notification.investment)
  notifications!: Notification[];

  @Column({ default: false })
  isCompounding!: boolean;

  @Column({ type: "decimal", precision: 10, scale: 2, default: 0 })
  earlyUnstakePenalty!: number;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
