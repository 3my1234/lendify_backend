import nodemailer from 'nodemailer';
import { config } from '../config/index';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.AUTH_EMAIL,
    pass: process.env.AUTH_PASS
  }
});

export const sendVerificationEmail = async (email: string, token: string) => {
  const verificationLink = `${process.env.FRONTEND_URL}/verify-email/${token}`;

  const mailOptions = {
    from: process.env.AUTH_EMAIL,
    to: email,
    subject: 'Verify Your Lendify Account',
    html: `
      <h1>Welcome to Lendify!</h1>
      <p>Please click the link below to verify your email address:</p>
      <a href="${verificationLink}">Verify Email</a>
      <p>This link will expire in 24 hours.</p>
    `
  };

  await transporter.sendMail(mailOptions);
};

export const sendPasswordResetEmail = async (email: string, token: string) => {
  const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;

  const mailOptions = {
    from: process.env.AUTH_EMAIL,
    to: email,
    subject: 'Reset Your ROLLEY Password',
    html: `
      <h1>Password Reset Request</h1>
      <p>Click the link below to reset your password:</p>
      <a href="${resetLink}">Reset Password</a>
      <p>This link will expire in 1 hour.</p>
      <p>If you didn't request a password reset, please ignore this email.</p>
    `
  };

  await transporter.sendMail(mailOptions);
};

export const sendAdminInviteEmail = async (email: string, token: string) => {
  const registrationLink = `${process.env.FRONTEND_URL}/admin/register/${token}`;

  const mailOptions = {
    from: process.env.AUTH_EMAIL,
    to: email,
    subject: 'Lendify Admin Invitation',
    html: `
      <h1>Welcome to Lendify Administrative Team!</h1>
      <p>You have been invited to join as an admin. Click the link below to set up your account:</p>
      <a href="${registrationLink}" style="display: inline-block; background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px;">Accept Invitation</a>
      <p>This invitation link will expire in 24 hours.</p>
      <p>If you weren't expecting this invitation, please ignore this email.</p>
      <p>Best regards,<br>Lendify Team</p>
    `
  };

  await transporter.sendMail(mailOptions);
};

export const sendAdminVerificationEmail = async (email: string, token: string) => {
  const verificationLink = `${process.env.FRONTEND_URL}/admin/verify-email?token=${token}`;

  const mailOptions = {
    from: process.env.AUTH_EMAIL,
    to: email,
    subject: 'Verify Your ROLLEY Admin Account',
    html: `
      <h1>Welcome to ROLLEY Admin Portal!</h1>
      <p>Please verify your admin account by clicking the link below:</p>
      <a href="${verificationLink}" style="display: inline-block; background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px;">Verify Admin Account</a>
      <p>This verification link will expire in 24 hours.</p>
      <p>If you didn't create this admin account, please contact support immediately.</p>
    `
  };

  await transporter.sendMail(mailOptions);
};
