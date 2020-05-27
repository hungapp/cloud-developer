'use strict';

const AWS = require('aws-sdk');

const docClient = new AWS.DynamoDB.DocumentClient();

const groupsTable = process.env.GROUPS_TABLE;

exports.handler = async (event) => {
  console.log('Processing event: ', event);

  // TODO: Read and parse "limit" and "nextKey" parameters from query parameters
  let limit;
  let nextKey;

  // Maximum number of elements to return
  // Next key to continue scan operation if necessary
  // HINT: You might find the following method useful to get an incoming parameter value

  // TODO: Return 400 error if parameters are invalid
  try {
    limit = parseLimitParam(event);
    nextKey = parseNextKeyParam(event);
  } catch (e) {
    console.log('Failed to parse query params', e.message);
    return {
      statusCode: 400,
      headers: {
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        error: 'Invalid parameters',
      }),
    };
  }

  // Scan operation parameter
  const scanParams = {
    TableName: groupsTable,
    // TODO: Set correct pagination parameters
    // Limit: ???,
    // ExclusiveStartKey: ???
    Limit: limit,
    ExclusiveStartKey: nextKey,
  };
  console.log('Scan params: ', scanParams);

  const result = await docClient.scan(scanParams).promise();

  const items = result.Items;

  console.log('Result: ', result);

  // Return result
  return {
    statusCode: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
    },
    body: JSON.stringify({
      items,
      // Encode the JSON object so a client can return it in a URL as is
      nextKey: encodeNextKey(result.LastEvaluatedKey),
    }),
  };
};

function parseLimitParam(event) {
  let limit;
  const limitStr = getQueryParameter(event, 'limit');
  if (!limitStr) {
    limit = 20;
  } else {
    limit = parseInt(limitStr, 10);
  }
  if (limit < 0) throw new Error('Limit should be positive');
  return limit;
}

function parseNextKeyParam(event) {
  const nextKeyStr = getQueryParameter(event, 'nextKey');
  if (!nextKeyStr) return null;
  const uriDecoded = decodeURIComponent(nextKeyStr);
  return JSON.parse(uriDecoded);
}

/**
 * Get a query paramet er or return "undefined"
 *
 * @param {Object} event HTTP event passed to a Lambda function
 * @param {string} name a name of a query parameter to return
 *
 * @returns {string} a value of a query parameter value or "undefined" if a parameter is not defined
 */
function getQueryParameter(event, name) {
  const queryParams = event.queryStringParameters;
  if (!queryParams) {
    return undefined;
  }

  return queryParams[name];
}

/**
 * Encode last evaluated key using
 *
 * @param {Object} lastEvaluatedKey a JS object that represents last evaluated key
 *
 * @return {string} URI encoded last evaluated key
 */
function encodeNextKey(lastEvaluatedKey) {
  if (!lastEvaluatedKey) {
    return null;
  }

  return encodeURIComponent(JSON.stringify(lastEvaluatedKey));
}
