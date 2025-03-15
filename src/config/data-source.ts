import "reflect-metadata";
import { DataSource } from "typeorm";
import { User } from "../models/User";
import { Investment } from "../models/Investment";
import { Notification } from "../models/Notification";
import { Transaction } from "../models/Transaction";
import { Support } from "../models/Support";
import { AdminInvite } from "../models/AdminInvite";
import { env } from './env.config';

export const AppDataSource = new DataSource({
    type: "postgres",
    host: env.DB_HOST,
    port: env.DB_PORT,
    username: env.DB_USERNAME,
    password: env.DB_PASSWORD,
    database: env.DB_NAME,
    synchronize: true,
    logging: true,
    entities: [User, Investment, Transaction, Support, AdminInvite, Notification],
    migrations: ["src/migrations/*.ts"],
    subscribers: ["src/subscribers/*.ts"]
});

// Initialize the data source
AppDataSource.initialize()
    .then(() => {
        console.log("✅ Database connection established");
    })
    .catch((error) => {
        console.error("❌ Database connection failed:", error);
    });
