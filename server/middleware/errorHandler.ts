import express from 'express';

let processHandlersRegistered = false;

export function registerProcessErrorGuards(): void {
  if (processHandlersRegistered) return;
  processHandlersRegistered = true;

  process.on('uncaughtException', (err) => {
    console.error('[UNCAUGHT EXCEPTION CAUGHT]:', err && err.stack ? err.stack : err);
  });

  process.on('unhandledRejection', (reason, promise) => {
    console.error('[UNHANDLED REJECTION CAUGHT] at:', promise, 'reason:', reason);
  });
}

export function errorHandler(
  err: any,
  _req: express.Request,
  res: express.Response,
  next: express.NextFunction
) {
  if (res.headersSent) {
    return next(err);
  }
  console.error('[SERVER ERROR MIDDLEWARE]:', err?.stack || err);
  const status = typeof err?.status === 'number' ? err.status : 500;
  res.status(status).json({
    error: err?.message || 'Internal server error',
  });
}
