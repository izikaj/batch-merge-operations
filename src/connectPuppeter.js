const puppeteer = require('puppeteer-core');
const launchChrome = require('./launchChrome');

async function connectPuppeter() {
  return new Promise((resolve) => {
    puppeteer.connect({
      browserURL: 'http://127.0.0.1:9222',
      defaultViewport: {
        width: 1440,
        height: 768,
      },
    }).then((browser) => resolve({ browser })).catch(() => {
      launchChrome().then((chrome) => {
        puppeteer.connect({
          browserURL: 'http://127.0.0.1:9222',
          defaultViewport: {
            width: 1440,
            height: 768,
          },
        }).then((browser) => resolve({ chrome, browser }));
      });
    });
  });
}

module.exports = connectPuppeter;
