Batch operations via puppeter

## Setup:

### Init config:
create sample config file
```
cp config.yml.sample config.yml
cp credentials.yml.sample credentials.yml
code config.yml credentials.yml
```

Generate app password here:
[app-passwords](https://bitbucket.org/account/settings/app-passwords/)

## Run:
run with config:
```
bin/merger config.yml
```

## To read:

### example API usage
curl -u "username:app_password" "https://api.bitbucket.org/2.0/repositories/team/repo"

### API docs
https://developer.atlassian.com/bitbucket/api/2/reference/resource/repositories
