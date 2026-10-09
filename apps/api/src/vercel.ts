import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import serverlessExpress from '@codegenie/serverless-express';
let server: (event: any, context: any, callback: any) => Promise<any>;

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({ origin: '*' });
  await app.init();

  const expressApp = app.getHttpAdapter().getInstance();
  return serverlessExpress({ app: expressApp });
}

export const handler = async (
  event: any,
  context: any,
  callback: any
) => {
  server = server ?? (await bootstrap());
  return server(event, context, callback);
};

export default handler;
