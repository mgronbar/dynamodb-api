const AWS = require('aws-sdk');
const uuidv4 = require('uuid/v4');

const dynamoDb = new AWS.DynamoDB.DocumentClient();

const processResponse = require('./process-response');

const { TABLE_NAME, CONFIG_TABLE_NAME, IS_CORS, PRIMARY_KEY } = process.env;

exports.get = event => {
  if (event.httpMethod === 'OPTIONS') {
    return Promise.resolve(processResponse(IS_CORS));
  }
  const { start, end, address } = event.queryStringParameters;

  const params = {
    TableName: TABLE_NAME,
    IndexName: 'address-created-index',
    // KeyConditionExpression: `#address = :v_address ${start? `AND #created > :v_start`:``} ${end? `AND #created < :v_end`:``}`,
    KeyConditionExpression: `#address = :v_address AND #created BETWEEN :v_start AND :v_end`,
    ExpressionAttributeNames: {
      '#address': 'address',
      '#created': 'created',
    },
    ExpressionAttributeValues: {
      ':v_address': address,
      ':v_start': parseInt(start, 10),
      ':v_end': parseInt(end, 10),
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
  const item = JSON.parse(event.body);
  item[PRIMARY_KEY] = uuidv4();
  const params = {
    TableName: TABLE_NAME,
    Item: item,
  };
  return dynamoDb
    .put(params)
    .promise()
    .then(() => processResponse(IS_CORS))
    .catch(dbError => {
      let errorResponse = `Error: Execution update, caused a Dynamodb error, please look at your logs.`;
      if (
        dbError.code === 'ValidationException' &&
        dbError.message.includes('reserved keyword')
      ) {
        errorResponse = `Error: You're using AWS reserved keywords as attributes`;
      }
      console.log(dbError);
      return processResponse(IS_CORS, errorResponse, 500);
    });
};

exports.getconfig = event => {
  if (event.httpMethod === 'OPTIONS') {
    return Promise.resolve(processResponse(IS_CORS));
  }

  const { address } = event.queryStringParameters;

  if (!address) {
    return Promise.resolve(
      processResponse(IS_CORS, `Error: You missing the address parameter`, 400),
    );
  }

  const key = {};
  key[PRIMARY_KEY] = address;
  const params = {
    TableName: CONFIG_TABLE_NAME,
    Key: key,
  };
  return dynamoDb
    .get(params)
    .promise()
    .then(response => processResponse(IS_CORS, response.Item))
    .catch(err => {
      console.log(err);
      return processResponse(IS_CORS, 'dynamo-error', 500);
    });
};

exports.postconfig = event => {
  if (event.httpMethod === 'OPTIONS') {
    return Promise.resolve(processResponse(IS_CORS));
  }
  if (!event.body) {
    return Promise.resolve(processResponse(IS_CORS, 'invalid', 400));
  }
  const item = JSON.parse(event.body);
  item[PRIMARY_KEY] = item.address;
  const params = {
    TableName: CONFIG_TABLE_NAME,
    Item: item,
  };
  return dynamoDb
    .put(params)
    .promise()
    .then(() => processResponse(IS_CORS))
    .catch(dbError => {
      let errorResponse = `Error: Execution update, caused a Dynamodb error, please look at your logs.`;
      if (
        dbError.code === 'ValidationException' &&
        dbError.message.includes('reserved keyword')
      ) {
        errorResponse = `Error: You're using AWS reserved keywords as attributes`;
      }
      console.log(dbError);
      return processResponse(IS_CORS, errorResponse, 500);
    });
};
