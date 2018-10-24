const AWS = require('aws-sdk');
const uuidv4 = require('uuid/v4');

const dynamoDb = new AWS.DynamoDB.DocumentClient();

const processResponse = require('./process-response');

const { TABLE_NAME, IS_CORS, PRIMARY_KEY, ITEM_KEY } = process.env;

exports.get = event => {
  if (event.httpMethod === 'OPTIONS') {
    return Promise.resolve(processResponse(IS_CORS));
  }
  const { start, end, address } = event.queryStringParameters;
  console.log('debug', start, address);
  const params = {
    TableName: TABLE_NAME,
    IndexName: 'address-created-index',
    KeyConditionExpression: '#address = :v_address AND #created > :v_created',
    ExpressionAttributeNames: {
      '#address': 'address',
      '#created': 'created',
    },
    ExpressionAttributeValues: {
      ':v_address': address,
      ':v_created': parseInt(start, 10),
    },
    ProjectionExpression: 'address, created, tagid, payload',
  };
  return dynamoDb
    .query(params)
    .promise()
    .then(response => processResponse(IS_CORS, response.Items))
    .catch(err => {
      console.log(err);
      return processResponse(IS_CORS, 'dynamo-error', 500);
    });
};

exports.post = event => {
  if (event.httpMethod === 'OPTIONS') {
    return Promise.resolve(processResponse(IS_CORS));
  }
  if (!event.body) {
    return Promise.resolve(processResponse(IS_CORS, 'invalid', 400));
  }
  let item = JSON.parse(event.body);
  item[PRIMARY_KEY] = uuidv4();
  let params = {
    TableName: TABLE_NAME,
    Item: item,
  };
  return dynamoDb
    .put(params)
    .promise()
    .then(() => processResponse(IS_CORS))
    .catch(dbError => {
      let errorResponse = `Error: Execution update, caused a Dynamodb error, please look at your logs.`;
      if (dbError.code === 'ValidationException') {
        if (dbError.message.includes('reserved keyword'))
          errorResponse = `Error: You're using AWS reserved keywords as attributes`;
      }
      console.log(dbError);
      return processResponse(IS_CORS, errorResponse, 500);
    });
};
