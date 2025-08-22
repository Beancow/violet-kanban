// This file configures the initialization of Sentry on the server.
// The config you add here will be used whenever the server handles a request.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from '@sentry/nextjs';

// Allow disabling Sentry during large rewrites using environment variable.
// Set DISABLE_SENTRY=1 (or 'true') to skip initialization on server.
const DISABLED =
    process.env.DISABLE_SENTRY === '1' || process.env.DISABLE_SENTRY === 'true';

if (!DISABLED) {
    Sentry.init({
        dsn: 'https://3efb49fd9eb7999b53d059e27def7f16@o4509742391427072.ingest.de.sentry.io/4509742392606800',

        // Define how likely traces are sampled. Adjust this value in production, or use tracesSampler for greater control.
        tracesSampleRate: 1,

        // Enable logs to be sent to Sentry
        enableLogs: true,

        // Setting this option to true will print useful information to the console while you're setting up Sentry.
        debug: false,
    });
} else {
    // eslint-disable-next-line no-console
    console.log('[sentry] disabled via DISABLE_SENTRY env var');
}
