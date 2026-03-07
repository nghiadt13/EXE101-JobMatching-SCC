import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './common/http/global-exception.filter';
import { createRequestContextMiddleware } from './common/http/request-context.middleware';
import { RequestContextService } from './common/http/request-context.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const webUrl = process.env['WEB_URL'] ?? 'http://localhost:3000';
  const requestContext = app.get(RequestContextService);

  app.setGlobalPrefix('api');
  app.enableCors({
    origin: [webUrl],
    credentials: true,
  });
  app.use(createRequestContextMiddleware(requestContext));
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.useGlobalFilters(app.get(GlobalExceptionFilter));

  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();
