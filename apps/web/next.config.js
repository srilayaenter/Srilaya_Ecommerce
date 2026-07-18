/** @type {import('next').NextConfig} */
const { withSentryConfig } = require("@sentry/nextjs");
const { withAxiom } = require("next-axiom");

const securityHeaders = [
  // Tell crawlers not to index preview / staging deployments.
  // VERCEL_ENV is "production" only on the main production deployment.
  ...(process.env.VERCEL_ENV !== 'production'
    ? [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }]
    : []),
  // Prevent the site from being embedded in iframes on other origins (clickjacking)
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  // Stop browsers from sniffing the MIME type
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  // Only send the origin (no path/query) in the Referer header to third parties
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  // Disable unnecessary browser features
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(), payment=(self "https://checkout.razorpay.com")',
  },
  // Enforce HTTPS for 1 year (enable once custom domain + SSL is live)
  { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
  // Content Security Policy — allows Razorpay checkout, Google OAuth, and app assets
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      // Next.js requires unsafe-inline for its runtime hydration scripts
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://checkout.razorpay.com",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https://images.unsplash.com https://placehold.co https://*.supabase.co",
      // Razorpay payment iframe
      "frame-src https://checkout.razorpay.com https://api.razorpay.com",
      // API calls to Razorpay and Google OAuth
      "connect-src 'self' https://api.razorpay.com https://accounts.google.com https://o*.ingest.sentry.io https://eu.i.posthog.com https://eu-assets.i.posthog.com",
      "font-src 'self' data:",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "upgrade-insecure-requests",
    ].join('; '),
  },
];

const nextConfig = {
  async headers() {
    return [
      {
        // Apply security headers to all routes
        source: '/(.*)',
        headers: securityHeaders,
      },
    ];
  },
  images: {
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30 days
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'placehold.co' },
      { protocol: 'https', hostname: '*.supabase.co' },
    ],
  },
};
module.exports = withAxiom(withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,

  // Route Sentry events through the Next.js app (/monitoring) so they pass
  // through our own domain — avoids needing sentry.io in the script-src CSP.
  tunnelRoute: "/monitoring",

  // Don't print Sentry build output on every Next.js compile
  silent: !process.env.CI,

  // Hide source maps from the public bundle — uploaded to Sentry only
  hideSourceMaps: true,

  webpack: {
    // Tree-shake Sentry debug/logger statements from the production bundle
    treeshake: { removeDebugLogging: true },
    // Automatically instrument Vercel Cron Monitors
    automaticVercelMonitors: true,
  },
}));