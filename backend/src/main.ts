import { NestFactory } from '@nestjs/core';
import { VersioningType } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  app.enableCors(configService.get('security.cors'));

  const trustProxy = configService.get<boolean>('security.https.trustProxy');
  if (trustProxy) {
    app.getHttpAdapter().getInstance().set('trust proxy', trustProxy);
  }

  const apiVersioningConfig = configService.get('security.apiVersioning') ?? {
    enabled: true,
    header: 'Accept-Version',
    defaultVersion: '1',
    globalPrefix: 'api/v1',
  };

  if (apiVersioningConfig.enabled) {
    app.enableVersioning({
      type: VersioningType.HEADER,
      header: apiVersioningConfig.header,
      defaultVersion: apiVersioningConfig.defaultVersion,
    });
    app.setGlobalPrefix(apiVersioningConfig.globalPrefix);
  }

  const port = configService.get<number>('app.port') ?? 3000;
  await app.listen(port);

  console.log(`Zaytuna backend listening on http://localhost:${port}`);
}

void bootstrap();
