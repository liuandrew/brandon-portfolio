module.exports = {
  ci: {
    collect: {
      staticDistDir: "./dist",
      chromePath: "/usr/bin/google-chrome",
      numberOfRuns: 1,
      maxAutodiscoverUrls: 0,
      puppeteerLaunchOptions: {
        args: [
          "--no-sandbox",
          "--disable-setuid-sandbox",
          "--disable-dev-shm-usage",
          "--disable-gpu",
        ],
      },
      settings: {
        onlyCategories: ["performance"],
        chromeFlags: "--no-sandbox --disable-setuid-sandbox --disable-dev-shm-usage --disable-gpu --user-data-dir=/tmp/lighthouse-profile",
      },
    },
    assert: {
      assertions: {
        "categories:performance": ["error", { minScore: 0.95 }],
        "largest-contentful-paint": ["error", { maxNumericValue: 1500 }],
      },
    },
  },
};
