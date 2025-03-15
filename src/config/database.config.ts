import { DataSource } from "typeorm";
import { User } from "../models/User";
import { Investment } from "../models/Investment";
import { Transaction } from "../models/Transaction";
import { AdminInvite } from "../models/AdminInvite";

export const AppDataSource = new DataSource({
  type: "postgres",
  host: process.env.DB_HOST || "localhost",
  port: parseInt(process.env.DB_PORT || "5432"),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  synchronize: process.env.NODE_ENV === "development",
  logging: process.env.NODE_ENV === "development",
  entities: [User, Investment, Transaction, AdminInvite],
  migrations: ["src/migrations/*.ts"],
  subscribers: ["src/subscribers/*.ts"],
});
