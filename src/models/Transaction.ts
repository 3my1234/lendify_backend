import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, OneToMany } from "typeorm";
import { User } from "./User";
import { TransactionStatus } from "../types/transaction";
import { Notification } from './Notification';

@Entity("transactions")
export class Transaction {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @ManyToOne(() => User, user => user.transactions)
  @JoinColumn({ name: "user_id" })
  user!: User;

  @Column({
    type: "enum",
    enum: ["deposit", "withdrawal", "investment", "return", "purchase", "bonus"],
  })
  type!: "deposit" | "withdrawal" | "investment" | "return" | "purchase" | "bonus";

  @Column({ type: "decimal", precision: 10, scale: 2 })
  amount!: number;

  @OneToMany(() => Notification, (notification: Notification) => notification.transaction)
  notifications!: Notification[];

  @Column({
    type: "enum",
    enum: ["pending", "completed", "failed", "active", "cancelled"],
    default: "pending"
  })
  status!: TransactionStatus;

  @Column({ unique: true })
  reference!: string;

  @Column('json', { nullable: true })
  investment_details?: {
    duration: number;
    returnRate: number;
    endDate: Date;
  };

  @Column('json', { nullable: true })
  crypto_details?: {
    type: string;
    amount: number;
    wallet_address: string;
  };

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
