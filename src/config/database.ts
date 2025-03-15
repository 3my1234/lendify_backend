import { DataSource } from "typeorm";
import { join } from "path";
import { env } from './env.config';

export const AppDataSource = new DataSource({
  type: "postgres",
  host: env.DB_HOST,
  port: env.DB_PORT,
  username: env.DB_USERNAME,
  password: env.DB_PASSWORD,
  database: env.DB_NAME,
  entities: [
    join(__dirname, "../models/**/*.ts")
  ],
  synchronize: env.NODE_ENV === 'development',
  logging: env.NODE_ENV === 'development'
});

export const connectDatabase = async () => {
  try {
    await AppDataSource.initialize();
    console.log('Database connected successfully');
  } catch (error) {
    console.error('Failed to connect to database:', error);
    process.exit(1);
  }
};
