import { Global, Module } from '@nestjs/common';
import { AppLogger } from './logging/app-logger.service';
import { RequestContextService } from './http/request-context.service';
import { GlobalExceptionFilter } from './http/global-exception.filter';

@Global()
@Module({
  providers: [RequestContextService, AppLogger, GlobalExceptionFilter],
  exports: [RequestContextService, AppLogger, GlobalExceptionFilter],
})
export class CommonModule {}
