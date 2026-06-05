import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);

  constructor(private configService: ConfigService) {}

  async send(phone: string, message: string): Promise<boolean> {
    const token   = this.configService.get('ESKIZ_TOKEN', '');
    const from    = this.configService.get('ESKIZ_FROM', 'EduCRM');

    if (!token) {
      this.logger.warn(`SMS (mock): ${phone} → ${message}`);
      return true; // Dev rejimda mock
    }

    try {
      const res = await fetch('https://notify.eskiz.uz/api/message/sms/send', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ mobile_phone: phone.replace(/\D/g, ''), message, from }),
      });
      const data = await res.json();
      if (data.status === 'success') {
        this.logger.log(`SMS yuborildi: ${phone}`);
        return true;
      }
      this.logger.error(`SMS xato: ${JSON.stringify(data)}`);
      return false;
    } catch (err) {
      this.logger.error(`SMS yuborishda xato: ${err}`);
      return false;
    }
  }

  async sendBulk(phones: string[], message: string) {
    const results = await Promise.allSettled(phones.map(p => this.send(p, message)));
    const sent = results.filter(r => r.status === 'fulfilled' && r.value).length;
    return { sent, failed: phones.length - sent };
  }
}
