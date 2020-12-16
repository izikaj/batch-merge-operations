const { spawn } = require('child_process');

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

module.exports = launchChrome;
