import cron from 'node-cron';

// Centralized configuration with defaults
const HEARTBEAT_CONFIG = {
  // Controlled by environment variables for easy activation/deactivation.
  // Default to 'false' to be safe.
  enabled: process.env.HEARTBEAT_ENABLED === 'true',

  // The schedule for the cron job, defaulting to every 10 minutes.
  // This is a safe interval for most free-tier hosting platforms.
  schedule: `*/${process.env.HEARTBEAT_INTERVAL_MINUTES || 10} * * * *`,

  // The internal endpoint to call. This should be an absolute URL.
  // We construct it from environment variables, defaulting to localhost for development.
  url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/heartbeat`,
};

/**
 * Starts the heartbeat cron job if it is enabled.
 * This function is designed to be called once on server startup.
 */
export function startHeartbeat() {
  // Only run if explicitly enabled
  if (!HEARTBEAT_CONFIG.enabled) {
    console.log('Heartbeat service is disabled. Skipping start.');
    return;
  }

  // Validate that the cron schedule is valid before starting.
  if (!cron.validate(HEARTBEAT_CONFIG.schedule)) {
    console.error(`[Heartbeat] Invalid cron schedule: "${HEARTBEAT_CONFIG.schedule}". Heartbeat will not start.`);
    return;
  }
  
  console.log(`[Heartbeat] Service starting. Schedule: "${HEARTBEAT_CONFIG.schedule}". URL: "${HEARTBEAT_CONFIG.url}"`);

  // Schedule the task.
  cron.schedule(HEARTBEAT_CONFIG.schedule, async () => {
    try {
      // Perform a fetch request to the app's own heartbeat endpoint.
      const response = await fetch(HEARTBEAT_CONFIG.url, { method: 'GET' });
      
      // Check if the request was successful.
      if (!response.ok) {
        throw new Error(`Heartbeat ping failed with status: ${response.status}`);
      }

      const data = await response.json();
      console.log(`[Heartbeat] Ping successful at ${new Date().toISOString()}:`, data);

    } catch (error) {
      console.error(`[Heartbeat] Error during ping at ${new Date().toISOString()}:`, error);
    }
  });
}
