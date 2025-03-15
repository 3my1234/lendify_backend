import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, OneToMany } from "typeorm";
import { User } from "./User";
import { Notification } from './Notification';

@Entity("support")
export class Support {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @ManyToOne(() => User, user => user.support_tickets)
  @JoinColumn({ name: "user_id" })
  user!: User;

  @Column()
  subject!: string;

  @Column("text")
  message!: string;

  @Column({
    type: "enum",
    enum: ["open", "in_progress", "resolved", "closed"],
    default: "open"
  })
  status!: "open" | "in_progress" | "resolved" | "closed";

  @Column("text", { array: true, default: [] })
  attachments!: string[];

  @Column("json", { array: true, default: [] })
  replies!: {
    user_id: string;
    message: string;
    timestamp: Date;
    attachments?: string[];
  }[];

  @OneToMany(() => Notification, (notification: Notification) => notification.support)
  notifications!: Notification[];

  @Column({ nullable: true })
  assigned_to?: string;

  @Column({ default: false })
  is_priority!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
