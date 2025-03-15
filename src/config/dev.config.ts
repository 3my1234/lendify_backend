import { env } from './env.config';

export const devConfig = {
  port: env.PORT,
  watch: true,
  ignore: ['node_modules', 'dist'],
  ext: 'ts,json',
  exec: 'ts-node ./src/server.ts'
};
