import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import * as crypto from 'crypto';

import { MailService } from '../mail/mail.service';

@Injectable()
export class PaymentService {
  private readonly payosClientId: string;
  private readonly payosApiKey: string;
  private readonly payosChecksumKey: string;
  private readonly isConfigured: boolean;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly mailService: MailService,
  ) {
    this.payosClientId = this.configService.get<string>('PAYOS_CLIENT_ID') || '';
    this.payosApiKey = this.configService.get<string>('PAYOS_API_KEY') || '';
    this.payosChecksumKey = this.configService.get<string>('PAYOS_CHECKSUM_KEY') || '';

    // Check if real keys are configured
    this.isConfigured =
      this.payosClientId.length > 0 &&
      this.payosApiKey.length > 0 &&
      this.payosChecksumKey.length > 0;
  }

  async getHistory(userId: string) {
    return this.prisma.transaction.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createIntent(userId: string, amount: number, planName?: string) {
    const orderCode = Date.now().toString() + Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    
    return this.prisma.transaction.create({
      data: {
        userId,
        amount,
        planName: planName || 'Unknown Plan',
        orderCode,
        status: 'PENDING',
      },
    });
  }

  private generateSignature(data: Record<string, any>): string {
    const sortedKeys = Object.keys(data).sort();
    const queryString = sortedKeys
      .map((key) => `${key}=${data[key]}`)
      .join('&');
    return crypto
      .createHmac('sha256', this.payosChecksumKey)
      .update(queryString)
      .digest('hex');
  }

  async createPaymentLink(userId: string, amount: number) {
    // Generate a unique 6-digit to 9-digit order code (must be integer)
    // PayOS orderCode must be a number <= 9007199254740991
    const orderCode = Math.floor(100000 + Math.random() * 900000) + Math.floor(Date.now() / 1000) % 1000000;

    const webUrl = this.configService.get<string>('WEB_URL') || 'http://localhost:3000';
    const cancelUrl = `${webUrl}/pricing`;
    const returnUrl = `${webUrl}/pricing/success?orderCode=${orderCode}`;
    const description = `Upgrade Pro Plan`;

    if (!this.isConfigured) {
      // Return simulated link if not configured
      const mockCheckoutUrl = `${webUrl}/pricing/simulate?orderCode=${orderCode}&amount=${amount}`;
      return {
        checkoutUrl: mockCheckoutUrl,
        orderCode,
        simulated: true,
      };
    }

    try {
      const dataToSign = {
        amount,
        cancelUrl,
        description,
        orderCode,
        returnUrl,
      };

      const signature = this.generateSignature(dataToSign);

      const response = await fetch('https://api-merchant.payos.vn/v2/payment-requests', {
        method: 'POST',
        headers: {
          'x-client-id': this.payosClientId,
          'x-api-key': this.payosApiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...dataToSign,
          signature,
        }),
      });

      const responseData = await response.json();

      if (!response.ok || responseData.code !== '00') {
        throw new BadRequestException(
          responseData.desc || 'Failed to create payment link with PayOS',
        );
      }

      return {
        checkoutUrl: responseData.data.checkoutUrl,
        orderCode,
        simulated: false,
      };
    } catch (error) {
      console.error('PayOS integration error:', error);
      // Fallback to simulation mode if API call fails
      const mockCheckoutUrl = `${webUrl}/pricing/simulate?orderCode=${orderCode}&amount=${amount}`;
      return {
        checkoutUrl: mockCheckoutUrl,
        orderCode,
        simulated: true,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  async verifyPayment(userId: string, orderCode: number, simulated?: boolean) {
    let paymentPaid = false;

    if (simulated || !this.isConfigured) {
      paymentPaid = true;
    } else {
      try {
        const response = await fetch(
          `https://api-merchant.payos.vn/v2/payment-requests/${orderCode}`,
          {
            method: 'GET',
            headers: {
              'x-client-id': this.payosClientId,
              'x-api-key': this.payosApiKey,
            },
          },
        );

        const responseData = await response.json();

        if (response.ok && responseData.code === '00') {
          const status = responseData.data.status;
          if (status === 'PAID') {
            paymentPaid = true;
          }
        }
      } catch (error) {
        console.error('PayOS verification error:', error);
      }
    }

    if (paymentPaid) {
      // Upgrade user's plan to Pro Plan
      const updatedUser = await this.prisma.user.update({
        where: { id: userId },
        data: { planName: 'Pro Plan' },
        select: {
          id: true,
          email: true,
          name: true,
          planName: true,
        },
      });

      return {
        success: true,
        user: updatedUser,
      };
    }

    return {
      success: false,
      message: 'Payment verification failed or payment is pending.',
    };
  }

  async handleSepayWebhook(payload: any) {
    console.log('================ SEPAY WEBHOOK RECEIVED ================');
    console.log(JSON.stringify(payload, null, 2));
    
    const amount = Number(payload?.transferAmount || payload?.amountIn || 0);
    const content = payload?.content || payload?.transactionContent || '';
    const transferType = payload?.transferType || 'in';
    
    // Check if it's an incoming transaction with sufficient amount
    if (transferType === 'in' && amount >= 49000) {
      // 1. Try to match by User ID (e.g., "SCC clk123456...")
      const idMatch = content.match(/SCC\s+([a-zA-Z0-9]+)/i);
      let upgraded = false;

      if (idMatch) {
        const userId = idMatch[1];
        try {
          const pendingTx = await this.prisma.transaction.findFirst({
            where: {
              userId,
              status: 'PENDING',
              amount: { lte: amount }, // Ensure amount transferred covers the transaction
            },
            orderBy: { createdAt: 'asc' },
          });

          if (pendingTx) {
            await this.prisma.transaction.update({
              where: { id: pendingTx.id },
              data: { status: 'SUCCESS', referenceCode: payload.referenceCode },
            });
            console.log(`[Success] Updated transaction ${pendingTx.id} to SUCCESS.`);
          } else {
            await this.prisma.transaction.create({
              data: {
                userId,
                amount,
                planName: 'Direct Transfer',
                orderCode: payload.referenceCode || Date.now().toString(),
                status: 'SUCCESS',
                referenceCode: payload.referenceCode,
              }
            });
            console.log(`[Success] Created new SUCCESS transaction for user ${userId}.`);
          }

          const updatedUser = await this.prisma.user.update({
            where: { id: userId },
            data: { planName: 'Pro Plan' },
            select: { email: true, name: true }
          });
          console.log(`[Success] Upgraded user ID ${userId} to Pro Plan via SePay`);
          
          this.mailService.sendUpgradeEmail(
            updatedUser.email,
            updatedUser.name,
            'Pro Plan',
            payload.referenceCode || Date.now().toString(),
          ).catch((e) => console.error('Failed to send upgrade email:', e));
          
          upgraded = true;
        } catch (error) {
          console.log(`[Info] User ID ${userId} error updating plan or transaction...`, error);
        }
      }

      // 2. Email fallback if ID match fails (e.g., "SCC test@example.com")
      if (!upgraded) {
        const emailMatch = content.match(/[\w.-]+@[\w.-]+\.\w+/);
        
        if (emailMatch) {
          const email = emailMatch[0];
          try {
            const user = await this.prisma.user.findUnique({ where: { email } });
            if (user) {
              const pendingTx = await this.prisma.transaction.findFirst({
                where: { userId: user.id, status: 'PENDING' },
                orderBy: { createdAt: 'asc' },
              });
              if (pendingTx) {
                await this.prisma.transaction.update({
                  where: { id: pendingTx.id },
                  data: { status: 'SUCCESS', referenceCode: payload.referenceCode },
                });
              } else {
                await this.prisma.transaction.create({
                  data: {
                    userId: user.id,
                    amount,
                    planName: 'Direct Transfer',
                    orderCode: payload.referenceCode || Date.now().toString(),
                    status: 'SUCCESS',
                    referenceCode: payload.referenceCode,
                  }
                });
              }
              const updatedUser = await this.prisma.user.update({
                where: { email },
                data: { planName: 'Pro Plan' },
                select: { email: true, name: true }
              });
              console.log(`[Success] Upgraded user ${email} to Pro Plan via SePay (Email match)`);
              
              this.mailService.sendUpgradeEmail(
                updatedUser.email,
                updatedUser.name,
                'Pro Plan',
                payload.referenceCode || Date.now().toString(),
              ).catch((e) => console.error('Failed to send upgrade email:', e));
              
              upgraded = true;
            }
          } catch (error) {
            console.error(`[Error] User with email ${email} not found or failed to update`);
          }
        }
      }

      if (!upgraded) {
        console.log(`[Warning] No matching User ID or Email found in transaction content: "${content}"`);
      }
    } else {
      console.log(`[Info] Transaction skipped: Type is ${transferType}, Amount is ${amount}`);
    }

    // Always return success so SePay knows we received the webhook
    return { success: true };
  }
}
