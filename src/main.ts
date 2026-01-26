import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: '*', // Permite conexiones desde cualquier lugar (Expo, Web, etc)
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'ngrok-skip-browser-warning' // 👈 ¡ESTA ES LA CLAVE!
    ],
  });

  app.useGlobalPipes(new ValidationPipe({
    whitelist: true, // Borra campos basura que no estén en el DTO
    forbidNonWhitelisted: true, // Tira error si mandan campos extra
  }));
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
