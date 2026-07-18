module.exports = {
  ci: {
    collect: {
      startServerCommand: "pnpm dev",
      startServerReadyPattern: "ready on",
      url: [
        "http://localhost:3000",
        "http://localhost:3000/product",
        "http://localhost:3000/category/foxtail-millet",
      ],
      numberOfRuns: 3,
    },
    assert: {
      assertions: {
        // Core Web Vitals — "good" thresholds per Google
        "first-contentful-paint":      ["warn",  { maxNumericValue: 1800 }],
        "largest-contentful-paint":    ["error", { maxNumericValue: 2500 }],
        "total-blocking-time":         ["warn",  { maxNumericValue: 200  }],
        "cumulative-layout-shift":     ["error", { maxNumericValue: 0.1  }],
        "speed-index":                 ["warn",  { maxNumericValue: 3400 }],
        // Lighthouse category scores
        "categories:performance":      ["warn",  { minScore: 0.75 }],
        "categories:accessibility":    ["warn",  { minScore: 0.90 }],
        "categories:best-practices":   ["warn",  { minScore: 0.90 }],
        "categories:seo":              ["error", { minScore: 0.90 }],
      },
    },
    upload: {
      target: "temporary-public-storage",
    },
  },
};
