/**
 * k6 load test — smoke + average load scenarios
 *
 * Install: https://k6.io/docs/get-started/installation/
 * Run smoke:   k6 run tests/load/k6-smoke.js
 * Run load:    k6 run --env SCENARIO=load tests/load/k6-smoke.js
 * Run spike:   k6 run --env SCENARIO=spike tests/load/k6-smoke.js
 *
 * Set BASE_URL env var for non-local targets:
 *   k6 run --env BASE_URL=https://srilayafoods.com tests/load/k6-smoke.js
 */

import http from "k6/http";
import { sleep, check } from "k6";
import { Rate, Trend } from "k6/metrics";

const BASE_URL  = __ENV.BASE_URL  || "http://localhost:3000";
const SCENARIO  = __ENV.SCENARIO  || "smoke";

const errorRate = new Rate("errors");
const lcp       = new Trend("lcp_proxy_ttfb_ms", true);

const scenarios = {
  smoke: {
    executor: "constant-vus",
    vus: 2,
    duration: "1m",
  },
  load: {
    executor: "ramping-vus",
    startVUs: 0,
    stages: [
      { duration: "2m", target: 20 },
      { duration: "5m", target: 20 },
      { duration: "2m", target: 0 },
    ],
  },
  spike: {
    executor: "ramping-vus",
    startVUs: 0,
    stages: [
      { duration: "30s", target: 5  },
      { duration: "30s", target: 80 },
      { duration: "1m",  target: 80 },
      { duration: "30s", target: 5  },
    ],
  },
};

export const options = {
  scenarios:  { [SCENARIO]: scenarios[SCENARIO] },
  thresholds: {
    http_req_duration: ["p(95)<2000", "p(99)<4000"],
    http_req_failed:   ["rate<0.01"],
    errors:            ["rate<0.01"],
  },
};

const PAGES = [
  { name: "homepage",  url: "/" },
  { name: "products",  url: "/product" },
  { name: "category",  url: "/category/foxtail-millet" },
  { name: "search",    url: "/search?q=millet" },
  { name: "healthz",   url: "/api/healthz" },
];

export default function () {
  const page = PAGES[Math.floor(Math.random() * PAGES.length)];
  const res  = http.get(`${BASE_URL}${page.url}`, {
    tags: { page: page.name },
  });

  const ok = check(res, {
    "status 200":      r => r.status === 200,
    "response < 2s":   r => r.timings.duration < 2000,
    "no error body":   r => !r.body?.includes('"error"'),
  });

  errorRate.add(!ok);
  lcp.add(res.timings.waiting); // TTFB as proxy for server-side rendering time

  sleep(Math.random() * 2 + 1); // 1–3 second think time
}

export function handleSummary(data) {
  return {
    stdout: JSON.stringify({
      p95_ms:   data.metrics.http_req_duration?.values?.["p(95)"],
      p99_ms:   data.metrics.http_req_duration?.values?.["p(99)"],
      error_rate: data.metrics.http_req_failed?.values?.rate,
      rps:      data.metrics.http_reqs?.values?.rate,
    }, null, 2),
  };
}
