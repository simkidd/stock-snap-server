import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as express from 'express';
import { AppModule } from './app.module';
import { config } from './utils/config';

const prodOrigins = ['https://stock-snap-client.vercel.app'];
const devOrigins = ['http://localhost:3000', 'http://localhost:5173'];

const env = config.NODE_ENV;

let origin: string[] | boolean;

if (env === 'production') {
  origin = prodOrigins;
} else if (env === 'development') {
  origin = [...prodOrigins, ...devOrigins];
} else {
  origin = true;
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin,
    credentials: true,
  });

  app.use(express.json());

  app.setGlobalPrefix(config.API_PATH);
  app.useGlobalPipes(new ValidationPipe({ enableDebugMessages: true }));

  const options = new DocumentBuilder()
    .setTitle('StockSnap')
    .setDescription('StockSnap API Documentation')
    .setVersion('1.0')
    .addBearerAuth({
      name: 'Authorization',
      bearerFormat: 'Bearer',
      scheme: 'Bearer',
      in: 'header',
      type: 'http',
    })
    .build();

  const doc = SwaggerModule.createDocument(app, options);
  SwaggerModule.setup('api/v1/docs', app, doc);

  await app.listen(config.PORT, () =>
    console.log(`Server listening on ${config.PORT}`),
  );
}
bootstrap();
