#!/usr/bin/env node
/**
 * Sends a test results email via the Resend API.
 * All inputs come from environment variables set by the CI workflow.
 *
 * Required env vars:
 *   RESEND_API_KEY, REPORT_PASSED, REPORT_FAILED, REPORT_TOTAL,
 *   REPORT_SCOPE, REPORT_COMMIT, REPORT_RUN_URL, REPORT_TRIGGER
 *
 * Optional:
 *   REPORT_TO      (default: avrsrikanth@gmail.com)
 *   REPORT_FROM    (default: SriLaYa CI <info@srilaya.com>)
 *   REPORT_ISSUE_URL  (set when a GitHub issue was created)
 */

const https = require('https');

const {
  RESEND_API_KEY: RESEND_API_KEY_RAW,
  REPORT_PASSED = '0',
  REPORT_FAILED = '0',
  REPORT_TOTAL  = '0',
  REPORT_SCOPE  = 'Unknown',
  REPORT_COMMIT = 'unknown',
  REPORT_RUN_URL = '',
  REPORT_TRIGGER = 'push',
  REPORT_TO      = 'avrsrikanth@gmail.com',
  REPORT_FROM    = 'SriLaYa CI <info@srilaya.com>',
  REPORT_ISSUE_URL = '',
} = process.env;

// GitHub Secrets can pick up a trailing newline/whitespace depending on how
// they were pasted in — Node's http client rejects that outright with
// ERR_INVALID_CHAR on the Authorization header, so strip it defensively.
const RESEND_API_KEY = RESEND_API_KEY_RAW?.trim();

if (!RESEND_API_KEY) {
  console.error('RESEND_API_KEY is not set — skipping email');
  process.exit(0);
}

const failed = parseInt(REPORT_FAILED, 10);
const passed = parseInt(REPORT_PASSED, 10);
const total  = parseInt(REPORT_TOTAL,  10);

const isPass     = failed === 0;
const statusIcon = isPass ? '✅' : '❌';
const statusText = isPass ? `All ${total} tests passed` : `${failed} test(s) failed`;
const accentColor = isPass ? '#006A38' : '#C62828';
const triggerLabel = REPORT_TRIGGER === 'schedule' ? 'Weekly scheduled run' : 'Post-deploy';

const subject = `${statusIcon} [SriLaYa CI] ${statusText} — ${REPORT_SCOPE} (${triggerLabel})`;

const issueRow = REPORT_ISSUE_URL
  ? `<tr><td style="padding:8px 0;font-weight:bold;color:#C62828;">Issue created</td>
     <td style="padding:8px 0;"><a href="${REPORT_ISSUE_URL}" style="color:#C62828;">View GitHub issue</a></td></tr>`
  : '';

const html = `
<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
  <div style="background:${accentColor};padding:20px 28px;">
    <h2 style="color:#fff;margin:0;font-size:18px;">${statusIcon} SriLaYa Naturals — CI Test Report</h2>
    <p style="color:rgba(255,255,255,0.8);margin:6px 0 0;font-size:13px;">${triggerLabel} · Staging environment</p>
  </div>
  <div style="padding:24px 28px;background:#fff;border:1px solid #e0e0e0;">
    <table style="width:100%;font-size:14px;color:#424242;border-collapse:collapse;">
      <tr>
        <td style="padding:8px 0;font-weight:bold;width:150px;">Status</td>
        <td style="padding:8px 0;font-weight:bold;color:${accentColor};">${statusText}</td>
      </tr>
      <tr style="background:#f9f9f9;">
        <td style="padding:8px 0;font-weight:bold;">Results</td>
        <td style="padding:8px 0;">${passed} passed &nbsp;·&nbsp; ${failed} failed &nbsp;·&nbsp; ${total} total</td>
      </tr>
      <tr>
        <td style="padding:8px 0;font-weight:bold;">Scope</td>
        <td style="padding:8px 0;">${REPORT_SCOPE}</td>
      </tr>
      <tr style="background:#f9f9f9;">
        <td style="padding:8px 0;font-weight:bold;">Commit</td>
        <td style="padding:8px 0;font-family:monospace;font-size:13px;">${REPORT_COMMIT}</td>
      </tr>
      <tr>
        <td style="padding:8px 0;font-weight:bold;">Actions run</td>
        <td style="padding:8px 0;"><a href="${REPORT_RUN_URL}" style="color:#006A38;">View full report →</a></td>
      </tr>
      ${issueRow}
    </table>
  </div>
  <div style="padding:16px 28px;background:#f5f5f5;font-size:12px;color:#999;text-align:center;">
    SriLaYa Naturals · Automated CI · Staging
  </div>
</div>`;

const payload = JSON.stringify({
  from:    REPORT_FROM,
  to:      [REPORT_TO],
  subject,
  html,
});

const req = https.request(
  {
    hostname: 'api.resend.com',
    path:     '/emails',
    method:   'POST',
    headers:  {
      'Authorization': `Bearer ${RESEND_API_KEY}`,
      'Content-Type':  'application/json',
      'Content-Length': Buffer.byteLength(payload),
    },
  },
  (res) => {
    let body = '';
    res.on('data', d => (body += d));
    res.on('end', () => {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        console.log('Email sent:', JSON.parse(body).id);
      } else {
        console.error('Resend error', res.statusCode, body);
        process.exit(1);
      }
    });
  }
);

req.on('error', (e) => { console.error('Request failed:', e.message); process.exit(1); });
req.write(payload);
req.end();
