// // utils/sendOtp.js
// const nodemailer = require('nodemailer');

// const transporter = nodemailer.createTransport({
//   service: 'gmail',
//   auth: {
//     user: process.env.EMAIL_USER,
//     pass: process.env.EMAIL_PASS,
//   },
// });

// const generateOtp = () => Math.floor(100000 + Math.random() * 900000).toString();

// const sendOtpEmail = async (email, otp) => {
//   const mailOptions = {
//     from: process.env.EMAIL_USER,
//     to: email,
//     subject: 'Your OTP Code',
//     text: `Your OTP for signup is: ${otp}. It will expire in 10 minutes.`,
//   };

//   await transporter.sendMail(mailOptions);
// };

// module.exports = { generateOtp, sendOtpEmail };

// // utils/sendOtp.js
// import nodemailer from 'nodemailer';

// const transporter = nodemailer.createTransport({
//   service: 'gmail',
//   auth: {
//     user: process.env.EMAIL_USER,
//     pass: process.env.EMAIL_PASS,
//   },
// });

// export const generateOtp = () => Math.floor(100000 + Math.random() * 900000).toString();

// export const sendOtpEmail = async (email, otp) => {
//   const mailOptions = {
//     from: process.env.EMAIL_USER,
//     to: email,
//     subject: 'Your OTP Code',
//     text: `Your OTP for signup is: ${otp}. It will expire in 10 minutes.`,
//   };

//   await transporter.sendMail(mailOptions);
// };

// utils/sendOtp.js
import { Resend } from 'resend';

// Initialize Resend with your API key
const resend = new Resend(process.env.RESEND_API_KEY);

export const generateOtp = () => 
  Math.floor(100000 + Math.random() * 900000).toString();

export const sendOtpEmail = async (email, otp) => {
  const { error } = await resend.emails.send({
    from: 'School App <onboarding@resend.dev>', // Resend sandbox domain (no setup needed)
    to: email,
    subject: 'Your OTP Code',
    text: `Your OTP for signup is: ${otp}. It will expire in 10 minutes.`,
  });

  if (error) {
    console.error('Resend error:', error);
    throw new Error('Failed to send OTP email');
  }
};