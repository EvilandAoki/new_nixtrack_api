import app from './app';
import { env } from './config/env';
import { testConnection } from './config/database';

async function start() {
  try {
    await testConnection();

    app.listen(env.port, () => {
      console.log(`Server running on port ${env.port}`);
      console.log(`Environment: ${env.nodeEnv}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

start();
