// This file configures the initialization of Sentry for edge features (middleware, edge routes, and so on).
// The config you add here will be used whenever one of the edge features is loaded.
// Note that this config is unrelated to the Vercel Edge Runtime and is also required when running locally.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

// Allow disabling Sentry during large rewrites using environment variable.
// Use DISABLE_SENTRY=1 (or 'true') to skip initialization in edge context.
const DISABLED = process.env.DISABLE_SENTRY === '1' || process.env.DISABLE_SENTRY === 'true';

if (!DISABLED) {
  Sentry.init({
    dsn: "https://3efb49fd9eb7999b53d059e27def7f16@o4509742391427072.ingest.de.sentry.io/4509742392606800",

    // Define how likely traces are sampled. Adjust this value in production, or use tracesSampler for greater control.
    tracesSampleRate: 1,

    // Enable logs to be sent to Sentry
    enableLogs: true,

    // Setting this option to true will print useful information to the console while you're setting up Sentry.
    debug: false,
  });
} else {
  // eslint-disable-next-line no-console
  console.log('[sentry] edge config disabled via DISABLE_SENTRY env var');
}
