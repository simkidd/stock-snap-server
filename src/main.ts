import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as express from 'express';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { config } from './utils/config';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

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

  // Security HTTP headers
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      contentSecurityPolicy: env === 'production' ? undefined : false,
    }),
  );

  app.enableCors({
    origin,
    credentials: true,
  });

  app.use(express.json());

  app.setGlobalPrefix(config.API_PATH);

  // Global Exception Filter for uniform error envelope
  app.useGlobalFilters(new HttpExceptionFilter());

  // Global Response Interceptor for uniform success response envelope
  app.useGlobalInterceptors(new ResponseInterceptor());

  // Whitelist-strict validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      enableDebugMessages: env !== 'production',
    }),
  );

  const options = new DocumentBuilder()
    .setTitle('StockSnap Retail POS')
    .setDescription(
      'StockSnap Nigerian Retail & Multi-Tenant POS API Documentation',
    )
    .setVersion('2.0')
    .addBearerAuth({
      name: 'Authorization',
      bearerFormat: 'Bearer',
      scheme: 'Bearer',
      in: 'header',
      type: 'http',
    })
    .build();

  const doc = SwaggerModule.createDocument(app, options);
  SwaggerModule.setup(`${config.API_PATH}/docs`, app, doc);

  await app.listen(config.PORT, () =>
    console.log(
      `🚀 StockSnap POS Server running on port ${config.PORT} (${env})`,
    ),
  );
}
bootstrap();
