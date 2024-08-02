import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as dotenv from 'dotenv';
import * as express from 'express';
import { config } from './utils/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: [],
    credentials: true,
  });

  app.use(express.json());

  app.useGlobalPipes(new ValidationPipe())

  const builder = new DocumentBuilder()
    .setTitle('PartyFun API Documentation')
    .setDescription('')
    .setVersion('1.0')
    .addBearerAuth({
      name: 'Authorization',
      bearerFormat: 'Bearer',
      scheme: 'Bearer',
      in: 'header',
      type: 'http',
    })
    .build();

  const doc = SwaggerModule.createDocument(app, builder);
  SwaggerModule.setup('api/v1/docs', app, doc);

  await app.listen(config.PORT, () =>
    console.log(`Server listening on ${config.PORT}`),
  );
}
bootstrap();
