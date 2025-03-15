import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: process.env.PORT || 5000,
  mongoUrl: process.env.DB_URL,
  jwtSecret: process.env.SECRET,
  email: {
    auth_email: process.env.AUTH_EMAIL,
    auth_pass: process.env.AUTH_PASS
  },
  frontend_url: process.env.FRONTEND_URL,
  node_env: process.env.NODE_ENV
};
