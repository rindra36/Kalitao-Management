import { NextResponse } from 'next/server';

/**
 * API route for the heartbeat service.
 * This endpoint is called by a cron job to keep the server instance alive.
 * @param {Request} req - The incoming request object.
 * @returns {NextResponse} A JSON response indicating the server is alive.
 */
export async function GET(req: Request) {
  try {
    // Return a simple JSON response to confirm the server is responsive.
    // The timestamp helps in logging and debugging.
    return NextResponse.json(
      { status: 'ok', timestamp: new Date().toISOString() },
      { status: 200 }
    );
  } catch (error) {
    // In case of any unexpected errors, log them and return a server error status.
    console.error('[Heartbeat API] Error:', error);
    return NextResponse.json(
      { status: 'error', message: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
