const puppeteer = require('puppeteer-core');
const { spawn } = require('child_process');
const YAML = require('yaml');
const fs = require('fs');

const configs = process.argv.slice(2).filter((value, index, self) => {
  return /.ya?ml$/i.test(value) && (self.indexOf(value) === index);
});
if (configs.length === 0) {
  configs.push('config.yml')
}
const REPOS = [];
for (const configFile of configs) {
  const config = YAML.parse(fs.readFileSync(configFile, 'utf8'))
  REPOS.push(...config.repos);
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function getSelectItems(page, selector) {
  return await page.evaluate((selector) => {
    const data = {};
    Array.prototype.forEach.call(
      document.querySelectorAll(`${selector} option`),
      function (node) {
        data[node.innerText.trim()] = node.value;
      },
    );
    return data;
  }, selector);
}

async function fillPoolRequest(page, repo, src = 'staging', dst = 'master') {
  await page.waitForSelector('select[data-field=source]');
  await sleep(100);
  const srcs = await getSelectItems(page, 'select[data-field=source]');
  const dsts = await getSelectItems(page, 'select[data-field=dest]');

  if (typeof srcs[src] !== 'string') {
    throw `Source branch [${src}] not found!`;
  }
  if (typeof dsts[dst] !== 'string') {
    throw `Destination branch [${dst}] not found!`;
  }

  await page.select('select[data-field=source]', srcs[src]);
  await page.select('select[data-field=dest]', dsts[dst]);
  await sleep(500);
  await page.evaluate((text) => {
    $('#id_title').val(text);
  }, `[AUTO] Release updates (${src} => ${dst})`);
  await sleep(500);

  try {
    await page.waitForSelector('#compare-content #commits', { timeout: 5000 });
  } catch (error) {
    throw `Create pool-request not possible!`;
  }

  try {
    await page.waitForSelector('#submitPrButton:not([disabled])', { timeout: 5000 });
  } catch (error) {
    throw `Create pool-request not possible!`;
  }
}

async function createPoolRequest(page, repo, src = 'staging', dst = 'master') {
  console.log(`>>> [${src}] > [${dst}] --- ${repo}`);
  const newRepoUrl = `${repo}/pull-requests/new`;
  await page.goto(newRepoUrl, { waitUntil: 'networkidle2' });

  await fillPoolRequest(page, repo, src, dst);
  await page.click('#submitPrButton');

  try {
    await page.waitForSelector('#reload-pr-page', { visible: true, timeout: 3000 });
    console.log('Branch data changed, need to reload PR...');
    await page.click('#reload-pr-page');
    try {
      await page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 5000 });
    } catch (error) {
    }
    await fillPoolRequest(page, repo, src, dst);
    await page.click('#submitPrButton');
  } catch (error) {
  }

  try {
    await page.waitForNavigation({ waitUntil: 'networkidle0' });
  } catch (error) {
    throw `create pool-request error`;
  }
}

async function closeHints(page) {
  await page.evaluate(() => {
    Array.prototype.slice.call(document.querySelectorAll('.atlaskit-portal button')).map(node => {
      if (node.innerText.trim() == 'Got it') {
        $(node).click();
      }
    });
  });
}

async function mergePoolRequest(page) {
  await page.waitForSelector('main header button');
  await closeHints(page);
  await page.evaluate(() => {
    const actSeletors = 'main header button, main header a, main header input[type=submit]';
    Array.prototype.forEach.call(document.querySelectorAll(actSeletors), node => {
      if (node.innerText.trim() == 'Merge') {
        $(node).click();
      }
    });
  });
  await page.evaluate(() => {
    Array.prototype.slice.call(document.querySelectorAll('.atlaskit-portal button')).map(node => {
      if (node.innerText.trim() == 'Merge') {
        $(node).click();
      }
    });
  });
  await sleep(200);

  let isOk = true;
  try {
    await page.waitForSelector(`[aria-label="You can't merge until you resolve all merge conflicts."]`, { visible: true, timeout: 5000 });
    isOk = false;
  } catch (error) {
  } finally {
    if (!isOk) {
      throw `You can't merge until you resolve all merge conflicts.`;
    }
  }
}

function launchChrome() {
  let started = false, exited = false;
  return new Promise((resolve, _reject) => {
    console.log(`😸 Launch Chrome...`);
    const chrome = spawn(
      '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
      [
        '--disable-extensions',
        '--remote-debugging-port=9222',
        '--no-first-run',
        '--no-default-browser-check',
        '--user-data-dir=/tmp/browser',
        // '--disable-web-security',
        // '--disable-features=IsolateOrigins,site-per-process',
      ],
    );

    chrome.stdout.on('data', (data) => {
      const line = data.toString().trim();
      // console.log(`😸 Browser: ${line}`);
      if (!started && !exited) {
        started = true;
        resolve(chrome);
      }
    });

    chrome.stderr.on('data', (data) => {
      const line = data.toString().trim();
      // console.log(`😾 Browser: ${line}`);
      if (/DevTools listening/.test(line)) {
        if (!started && !exited) {
          started = true;
          resolve(chrome);
        }
      }
    });

    chrome.on('close', (code) => {
      console.log(`🙀 Browser: exited with code ${code}`);
      process.exit(code);
    });
  });

}

async function connectPuppeter() {
  let browser;
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
        }).then((browser) => resolve({ browser }));
      });
    });
  });
}

async function start() {
  const { chrome, browser } = await connectPuppeter();

  try {
    const page = await browser.newPage();
    await page.goto(REPOS[0].repo, { waitUntil: 'networkidle0' });
    try {
      await page.waitForSelector('#google-signin-button', { timeout: 3000 });
      await page.click('#google-signin-button');
      await page.waitForNavigation({ timeout: 5000 });
      await page.click('[data-authuser="0"]');
      await page.waitForNavigation({ timeout: 15000 });
    } catch (error) {
      // await page.screenshot({ path: `dry-run.png` });
    }
    await page.close();
  } catch (error) {
    // await page.screenshot({ path: `dry-run2.png` });
  }

  try {
    for (const repo of REPOS) {
      const parts = repo.repo.split('/').filter(p => p.length > 0);
      const name = parts[parts.length - 1];
      const page = await browser.newPage();
      try {
        await createPoolRequest(page, repo.repo, repo.src, repo.dst);
        await mergePoolRequest(page);
        console.log(`${name} - OK`);
      } catch (error) {
        await page.screenshot({ path: `screen/error_${name}_from_${repo.src}_to_${repo.dst}.png`, fullPage: false });
        console.error(error);
        await sleep(100);
      } finally {
        await sleep(100);
        await page.close();
        await sleep(100);
      }
    }
  } finally {
    await browser.disconnect();
    await sleep(100);
    if (chrome) {
      // kill chrome if launched automatically
      chrome.kill();
    }
  }
}

//
; (async () => {
  try {
    await start();
  } catch (error) {
    console.error(error);
  }
})();
