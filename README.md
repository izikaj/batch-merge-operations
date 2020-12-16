Batch operations via puppeter

## Setup:

### Init config:
create sample config file
```
cp config.yml.sample config.yml
code config.yml
```


### Setup browser authorization:
```
npm run chrome
```
in opened browser window you can sign in with your profile

## Run:
run with default config:
```
npm start
```
run for some other configs:
```
npm start other-config.yml one-more-config.yml ...
```

### launch Chrome manually
```
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"  --remote-debugging-port=9222 --no-first-run --no-default-browser-check --user-data-dir=/tmp/browser
```
