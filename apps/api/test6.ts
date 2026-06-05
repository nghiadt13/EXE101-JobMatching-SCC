import { NestFactory } from '@nestjs/core';
import { AppModule } from './src/app.module';
import { PrismaService } from './src/prisma/prisma.service';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const prisma = app.get(PrismaService);

  const cvs = await prisma.cV.findMany({ select: { fileName: true, mimeType: true } });
  console.log(cvs);

  await app.close();
}
bootstrap();
