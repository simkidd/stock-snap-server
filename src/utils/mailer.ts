import * as nodemailer from 'nodemailer';
import { config } from './config';

interface MailOptions {
  to: string | { name: string; address: string };
  subject: string;
  html?: string;
  from?: string | { name: string; address: string };
}

const transporter = nodemailer.createTransport({
  host: config.EMAIL_HOST,
  port: parseInt(config.EMAIL_PORT),
  auth: {
    user: config.EMAIL_USERNAME,
    pass: config.EMAIL_PASSWORD,
  },
  // ignoreTLS: config.EMAIL_IGNORE_TLS,
});

export class MailService {
  async sendMail(payload: MailOptions): Promise<void> {
    const mailOptions = {
      from: payload?.from || config.MAIL_SENDER,
      to: payload.to,
      subject: payload?.subject,
      html: payload?.html,
    };

    try {
      const info = await transporter.sendMail(mailOptions);
      console.log('Message sent: %s', info.messageId);
    } catch (error) {
      console.error('Error sending email:', error);
    }
  }
}
