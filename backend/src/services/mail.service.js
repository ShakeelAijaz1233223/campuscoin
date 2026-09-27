const nodemailer = require('nodemailer');
const env = require('../config/env');
const sendPasswordReset = async (email, token) => {
  if (!process.env.SMTP_HOST) {
    if (env.NODE_ENV === 'production') {
      throw new (require('../utils/errors').AppError)('Password reset email is not configured. Contact the administrator.',503);
    }
    return false;
  }
  const transport = nodemailer.createTransport({
    host: process.env.SMTP_HOST, port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === 'true',
    ...(process.env.SMTP_USER ? {auth:{user:process.env.SMTP_USER,pass:process.env.SMTP_PASSWORD}} : {})
  });
  const url = `${env.CLIENT_URL.split(',')[0].replace(/\/$/,'')}/reset-password/${encodeURIComponent(token)}`;
  await transport.sendMail({from:process.env.SMTP_FROM || process.env.SMTP_USER,to:email,subject:'Reset your CampusCoin password',text:`Open this link to reset your password:\n${url}\n\nIf you did not request this, ignore this email. This link expires in one hour.`});
  return true;
};
module.exports = { sendPasswordReset };
