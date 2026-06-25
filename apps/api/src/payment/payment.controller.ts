import { Body, Controller, Post, Get, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PaymentService } from './payment.service';

@Controller('payment')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @UseGuards(JwtAuthGuard)
  @Post('create-link')
  createPaymentLink(
    @CurrentUser() user: { sub: string },
    @Body() body: { amount: number },
  ) {
    return this.paymentService.createPaymentLink(user.sub, body.amount);
  }

  @UseGuards(JwtAuthGuard)
  @Post('verify')
  verifyPayment(
    @CurrentUser() user: { sub: string },
    @Body() body: { orderCode: number; simulated?: boolean },
  ) {
    return this.paymentService.verifyPayment(user.sub, body.orderCode, body.simulated);
  }

  @UseGuards(JwtAuthGuard)
  @Get('history')
  getHistory(@CurrentUser() user: { sub: string }) {
    return this.paymentService.getHistory(user.sub);
  }

  @UseGuards(JwtAuthGuard)
  @Post('intent')
  createIntent(
    @CurrentUser() user: { sub: string },
    @Body() body: { amount: number; planName?: string },
  ) {
    return this.paymentService.createIntent(user.sub, body.amount, body.planName);
  }

  @Post('sepay-webhook')
  async handleSepayWebhook(@Body() payload: any) {
    return this.paymentService.handleSepayWebhook(payload);
  }
}
