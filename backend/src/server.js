const app = require('./app');
const env = require('./config/env');
const db = require('./config/database');
const logger = require('./utils/logger');
const recurringService = require('./services/recurring.service');
const billService = require('./services/bill.service');
const fs = require('fs');
const path = require('path');

const ensureDirectories = () => {
  for (const dir of ['uploads', 'exports', 'logs']) {
    const dirPath = path.join(__dirname, `../${dir}`);
    if (!fs.existsSync(dirPath)) fs.mkdirSync(dirPath, { recursive: true });
  }
};

const runScheduledJobs = async () => {
  try {
    // Generate due recurring transactions
    const recurringResult = await recurringService.processDueRecurring();
    if (recurringResult.generated > 0) {
      logger.info(`Recurring job: generated ${recurringResult.generated} transactions`);
    }
    // Bill reminders & overdue notifications
    const billResult = await billService.processBillReminders();
    if (billResult.reminders > 0 || billResult.overdue > 0) {
      logger.info(`Bill job: ${billResult.reminders} reminders, ${billResult.overdue} overdue notices`);
    }
  } catch (err) {
    logger.error(`Scheduled job error: ${err.message}`);
  }
};

const startScheduler = () => {
  // Run scheduled jobs every hour
  const interval = setInterval(runScheduledJobs, 60 * 60 * 1000);
  interval.unref();
  // Also run shortly after boot
  setTimeout(runScheduledJobs, 10 * 1000).unref();
};

const startServer = async () => {
  try {
    ensureDirectories();
    await db.testConnection();
    logger.info('Starting CampusCoin server...');

    const server = app.listen(env.PORT, '0.0.0.0', () => {
      logger.info(`CampusCoin API running on port ${env.PORT} in ${env.NODE_ENV} mode`);
      logger.info(`API base URL: http://localhost:${env.PORT}/api/v1`);
    });

    startScheduler();

    const shutdown = (signal) => {
      logger.info(`${signal} received. Shutting down gracefully...`);
      server.close(async () => {
        await db.pool.end();
        logger.info('Server closed. Database pool released.');
        process.exit(0);
      });
      setTimeout(() => process.exit(1), 10000).unref();
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  } catch (err) {
    logger.error(`Failed to start server: ${err.message}`);
    logger.error('Check your MySQL connection settings in .env');
    process.exit(1);
  }
};

startServer();
