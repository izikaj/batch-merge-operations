async function closeHints(page) {
  await page.evaluate(() => {
    Array.prototype.slice.call(document.querySelectorAll('.atlaskit-portal button')).map(node => {
      if (node.innerText.trim() == 'Got it') {
        $(node).click();
      }
    });
  });
}

module.exports = closeHints;
