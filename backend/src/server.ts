import { config } from 'dotenv';
import { createApp } from './app.js';
import { database } from './config/database.js';
import { parseEnvironment } from './config/env.js';

config({ quiet: true });

async function startServer() {
  const env = parseEnvironment(process.env);
  await database.$connect();
  const app = createApp({ frontendUrl: env.FRONTEND_URL });
const server = app.listen(env.PORT, '0.0.0.0');
server.on('listening', () => console.info(`API listening on port ${env.PORT}`));
  server.on('error', () => {
    console.error('Unable to start HTTP server. Check the configured port.');
    void database.$disconnect().finally(() => { process.exitCode = 1; });
  });

  let stopping = false;
  const shutdown = () => {
    if (stopping) return;
    stopping = true;
    const deadline = setTimeout(() => process.exit(1), 10000);
    deadline.unref();
    server.close((error) => {
      void database.$disconnect().then(() => {
        clearTimeout(deadline);
        process.exitCode = error ? 1 : 0;
      }).catch(() => { process.exitCode = 1; });
    });
  };
  process.once('SIGINT', shutdown);
  process.once('SIGTERM', shutdown);
}

void startServer().catch(async () => {
  console.error('Startup failed. Check the environment configuration and database availability.');
  await database.$disconnect();
  process.exitCode = 1;
});
