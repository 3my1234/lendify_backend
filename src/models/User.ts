import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from "typeorm";
import { Investment } from "./Investment";
import { Transaction } from "./Transaction";
import { Support } from "./Support";
import { Notification } from './Notification';

@Entity("users")
export class User {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ unique: true })
  username!: string;

  @Column({ unique: true })
  email!: string;

  @Column()
  password!: string;

  @Column({
    type: "enum",
    enum: ["user", "admin", "super_admin"],
    default: "user"
  })
  role!: "user" | "admin" | "super_admin";

  @Column({ default: false })
  is_active!: boolean;

  @Column({ nullable: true })
  verificationToken?: string;

  @Column({ type: 'timestamp', nullable: true })
  verificationExpires?: Date;

  @Column({ nullable: true })
  resetPasswordToken?: string;

  @Column({ nullable: true })
  resetPasswordExpires?: Date;

  @Column({ default: false })
  profile_completed!: boolean;

  @Column({ nullable: true })
  fullName?: string;

  @Column({ nullable: true })
  phoneNumber?: string;

  @Column({ nullable: true })
  address?: string;

  @Column({ type: "decimal", precision: 10, scale: 2, default: 0 })
  investment_balance!: number;

  @OneToMany(() => Notification, notification => notification.user)
 notifications!: Notification[];

  @Column({ unique: true, nullable: true })
  userIndex?: number;

  @Column({ unique: true, nullable: true })
  adminIndex?: number;

  @Column('json', { nullable: true })
  bank_details?: {
    bank_name: string;
    account_number: string;
    account_name: string;
  };

  @Column('json', { nullable: true })
  crypto_wallets?: {
    btc?: string;
    eth?: string;
    sol?: string;
    xmr?: string;
  };

  @Column({ unique: true, nullable: true })
  referral_code?: string;

  @Column({ nullable: true })
  referred_by?: string;

  @Column({ type: "decimal", precision: 10, scale: 2, default: 0 })
  referral_earnings!: number;

  @OneToMany(() => Investment, investment => investment.user)
  investments!: Investment[];

  @OneToMany(() => Transaction, transaction => transaction.user)
  transactions!: Transaction[];

  @OneToMany(() => Support, support => support.user)
  support_tickets?: Support[];
  

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
  
}
