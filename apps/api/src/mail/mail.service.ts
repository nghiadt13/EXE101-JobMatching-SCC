import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';
import {
  getWelcomeEmailHtml,
  getUpgradeEmailHtml,
  getSmartMatchesEmailHtml,
} from './templates/email.template';

@Injectable()
export class MailService {
  private resend: Resend;
  private readonly logger = new Logger(MailService.name);
  private defaultFrom = 'onboarding@resend.dev';

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('RESEND_API_KEY');
    if (apiKey) {
      this.resend = new Resend(apiKey);
    } else {
      this.logger.warn(
        'RESEND_API_KEY is not configured. Emails will not be sent.',
      );
    }
  }

  async sendWelcomeEmail(to: string, userName: string) {
    if (!this.resend) return;
    try {
      await this.resend.emails.send({
        from: this.defaultFrom,
        to,
        subject: 'Welcome to Smart Job Matching',
        html: getWelcomeEmailHtml(userName),
      });
      this.logger.log(`Welcome email sent to ${to}`);
    } catch (error) {
      this.logger.error(`Failed to send welcome email to ${to}`, error);
    }
  }

  async sendUpgradeEmail(
    to: string,
    userName: string,
    planName: string,
    orderCode: string,
  ) {
    if (!this.resend) return;
    try {
      await this.resend.emails.send({
        from: this.defaultFrom,
        to,
        subject: 'Welcome to Pro',
        html: getUpgradeEmailHtml(userName, planName, orderCode),
      });
      this.logger.log(`Upgrade email sent to ${to}`);
    } catch (error) {
      this.logger.error(`Failed to send upgrade email to ${to}`, error);
    }
  }

  async sendSmartMatchesEmail(to: string, userName: string, matchesCount: number) {
    if (!this.resend) return;
    try {
      await this.resend.emails.send({
        from: this.defaultFrom,
        to,
        subject: 'Your Smart Job Matches Are Ready',
        html: getSmartMatchesEmailHtml(userName, matchesCount),
      });
      this.logger.log(`Smart matches email sent to ${to}`);
    } catch (error) {
      this.logger.error(`Failed to send smart matches email to ${to}`, error);
    }
  }
}
