import { Injectable } from '@nestjs/common';
import { config } from './config';

export interface MailOptions {
  to: string | { name: string; address: string };
  subject: string;
  html?: string;
  text?: string;
  from?: string | { name: string; address: string };
}

export interface SmsOptions {
  recipient: string; // e.g. '+2348031234567' or '08031234567'
  content: string;
  senderName?: string; // Max 11 alphanumeric characters
}

@Injectable()
export class MailService {
  /**
   * Send Email via Brevo REST API v3
   */
  async sendMail(payload: MailOptions): Promise<boolean> {
    const toEmail = typeof payload.to === 'string' ? payload.to : payload.to.address;
    const toName = typeof payload.to === 'string' ? '' : payload.to.name;

    if (!config.BREVO_API_KEY) {
      console.log(`[Brevo Email Mock] To: ${toEmail} | Subject: "${payload.subject}" (Set BREVO_API_KEY in .env to deliver real emails)`);
      return true;
    }

    try {
      const response = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'api-key': config.BREVO_API_KEY,
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          sender: {
            name: config.BREVO_SENDER_NAME,
            email: config.BREVO_SENDER_EMAIL,
          },
          to: [{ email: toEmail, name: toName }],
          subject: payload.subject,
          htmlContent: payload.html || `<p>${payload.text}</p>`,
          textContent: payload.text,
        }),
      });

      if (response.ok) {
        const resJson = await response.json();
        console.log(`[Brevo Email] Message sent successfully to ${toEmail}. MessageId: ${resJson.messageId}`);
        return true;
      } else {
        const errText = await response.text();
        console.error(`[Brevo Email Error] Status ${response.status}: ${errText}`);
        return false;
      }
    } catch (err) {
      console.error('[Brevo Email Exception]', err);
      return false;
    }
  }

  /**
   * Format Nigerian Phone number to International E.164 format (+234...)
   */
  private formatPhoneNumber(phone: string): string {
    let clean = phone.replace(/[^0-9+]/g, '');
    if (clean.startsWith('0') && clean.length === 11) {
      clean = '+234' + clean.slice(1);
    } else if (clean.startsWith('234') && !clean.startsWith('+')) {
      clean = '+' + clean;
    } else if (!clean.startsWith('+')) {
      clean = '+234' + clean;
    }
    return clean;
  }

  /**
   * Send Transactional SMS via Brevo SMS API v3
   */
  async sendSms(options: SmsOptions): Promise<boolean> {
    const formattedRecipient = this.formatPhoneNumber(options.recipient);
    const sender = (options.senderName || config.BREVO_SMS_SENDER).slice(0, 11);

    if (!config.BREVO_API_KEY) {
      console.log(`[Brevo SMS Mock] To: ${formattedRecipient} | Sender: ${sender} | Message: "${options.content}"`);
      return true;
    }

    try {
      const response = await fetch('https://api.brevo.com/v3/transactionalSMS/send-transacSms', {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'api-key': config.BREVO_API_KEY,
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          sender: sender,
          recipient: formattedRecipient,
          content: options.content,
          type: 'transactional',
        }),
      });

      if (response.ok) {
        const resJson = await response.json();
        console.log(`[Brevo SMS] SMS delivered to ${formattedRecipient}. MessageId: ${resJson.messageId}`);
        return true;
      } else {
        const errText = await response.text();
        console.error(`[Brevo SMS Error] Status ${response.status}: ${errText}`);
        return false;
      }
    } catch (error) {
      console.error('[Brevo SMS Exception]', error);
      return false;
    }
  }

  /**
   * Helper: Send instant SMS Receipt to Customer
   */
  async sendCustomerReceiptSms(params: {
    customerPhone: string;
    customerName?: string;
    invoiceNo: string;
    totalAmount: number;
    storeName?: string;
  }): Promise<boolean> {
    const formattedTotal = `₦${params.totalAmount.toLocaleString('en-NG', { minimumFractionDigits: 2 })}`;
    const store = params.storeName || 'StockSnap Supermarket';
    const message = `Thanks for shopping at ${store}! Invoice #${params.invoiceNo} for ${formattedTotal} was successful. We appreciate your patronage!`;
    return this.sendSms({
      recipient: params.customerPhone,
      content: message,
    });
  }

  /**
   * Helper: Send Low Stock SMS Alert to Store Owner / Manager
   */
  async sendLowStockAlertSms(params: {
    ownerPhone: string;
    productName: string;
    remainingQty: number;
  }): Promise<boolean> {
    const message = `⚠️ STOCK ALERT: "${params.productName}" is running low on stock. Only ${params.remainingQty} units left in store. Please reorder.`;
    return this.sendSms({
      recipient: params.ownerPhone,
      content: message,
    });
  }
}
