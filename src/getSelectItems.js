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

module.exports = getSelectItems;
