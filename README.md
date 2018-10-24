# Ruuvi data api

Ruuvi DynamoDB

## Prerequisites

Requires aws credentials
export AWS_PROFILE=myprofile

in `~/.aws/credentials` file

```
[myprofile]
aws_access_key_id = <aws accesskey>
aws_secret_access_key = <aws secret key>
region = eu-central-1
default_aws_region = eu-central-1
```

## Amazon S3 repo for CloudFormation stack storage

if not created the S3 repo, can be created with:

```
aws --profile ${AWS_PROFILE} s3 mb s3://dynamo-api-ruuvi-storage
```

## Package and Deploy to AWS

Install to AWS lambda with Cloudformation Stack

```
yarn packageDeploy
```

## REST API

## TODO

- DOES not work yet as whole:
  - Add pemissins for lambda to be executed from API gateway
  - Add Dynamodb index creation

### Test with curl on commandline or e.g. postman

requires `<apikey>` from AWS API gateway

Get gateway id:

```
API_GW_ID=$(aws --profile ${AWS_PROFILE} apigateway get-rest-apis | jq '.items[] | select(.name == "ruuvi-api") | .id'|tr -d '\"')
```

TestApiKey are created by default and can be retrieved with following commands:

Apikey id

```
API_KEY_ID=$(aws --profile ${AWS_PROFILE} apigateway get-api-keys | jq '.items[] | select(.name == "TestApiKey") | .id'|tr -d '"')
```

Apikey:

```
API_KEY=$(aws --profile ${AWS_PROFILE} apigateway get-api-key \--cli-input-json "{\"apiKey\":\"$API_KEY_ID\",\"includeValue\":true}" | jq '.value'|tr -d '"')
```

#### Get data from API

```
curl -X GET \
  https://$API_GW_ID.execute-api.eu-west-1.amazonaws.com/prod/ruuvi \
  -H "x-api-key: $API_KEY"
```

#### Push data to API

```
curl -X POST \
  https://$API_GW_ID.execute-api.eu-west-1.amazonaws.com/prod/ruuvi \
  -H 'Content-Type: application/json' \
  -H "x-api-key:$API_KEY" \
  -d '{"timestamp":"2018-08-16T11:37:30.940Z",
      "payload":{
	      "temperature":20,
	      "humidity":60,
	      "pressure":1024}}'
```
