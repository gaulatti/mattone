import { NestFactory } from '@nestjs/core';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import multipart from '@fastify/multipart';
import { TelemetryService } from './telemetry/telemetry.service';

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter(),
  );

  // Cast to any to avoid type mismatch between Fastify versions in typings
  await app.register(multipart as any);

  app.enableCors({
    origin: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Device-ID',
      'X-Platform',
    ],
    credentials: true,
  });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));

  // Prometheus HTTP request metrics
  const telemetryService = app.get(TelemetryService);
  const httpAdapter = app.getHttpAdapter().getInstance();
  httpAdapter.addHook(
    'onResponse',

    (request: any, reply: any) => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
      const method: string = request.method;
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
      const route: string = request.routerPath ?? request.url ?? 'unknown';
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
      const statusCode: number = reply.statusCode;

      const durationSeconds =
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        typeof reply.getResponseTime === 'function'
          ? // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
            (reply.getResponseTime() as number) / 1000
          : 0;
      telemetryService.recordApiRequest(
        method,
        route,
        statusCode,
        durationSeconds,
      );
    },
  );

  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT', 3000);

  await app.listen(port, '0.0.0.0');
  console.log(`Application is running on: ${await app.getUrl()}`);
}
bootstrap();
