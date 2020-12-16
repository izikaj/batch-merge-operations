const YAML = require('yaml');
const fs = require('fs');

function getRepos() {
  const configs = process.argv.slice(2).filter((value, index, self) => {
    return /.ya?ml$/i.test(value) && (self.indexOf(value) === index);
  });

  if (configs.length === 0) {
    configs.push('config.yml')
  }

  const repos = [];
  for (const configFile of configs) {
    const config = YAML.parse(fs.readFileSync(configFile, 'utf8'))
    repos.push(...config.repos);
  }
  return repos;
}

module.exports = getRepos;
