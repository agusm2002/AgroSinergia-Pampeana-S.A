import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: true,
    credentials: true,
    exposedHeaders: ['x-total-count'],
  });

  await app.listen(process.env.PORT ?? 3001, '0.0.0.0');
}
void bootstrap();
