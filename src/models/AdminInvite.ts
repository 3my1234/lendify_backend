import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, OneToMany } from "typeorm";
import { Notification } from './Notification';

@Entity('admin_invites')
export class AdminInvite {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  email!: string;

  @Column({ unique: true })
  token!: string;

  @Column({ type: 'varchar', default: 'admin' })
  role!: string;

  @Column()
  expires!: Date;

  @Column({ default: false })
  used!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @OneToMany(() => Notification, (notification: Notification) => notification.adminInvite)
  notifications!: Notification[];
}

export interface IAdminInvite {
  email: string;
  token: string;
  role: string;
  expires: Date;
  used: boolean;
}
