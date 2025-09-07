import { startHeartbeat } from './services/heartbeat';

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    startHeartbeat();
  }
}
