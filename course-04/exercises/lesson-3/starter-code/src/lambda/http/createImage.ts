import {
  APIGatewayProxyHandler,
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
} from 'aws-lambda';
import 'source-map-support/register';
import * as AWS from 'aws-sdk';
import * as uuid from 'uuid';
const docClient = new AWS.DynamoDB.DocumentClient();

const groupsTable = process.env.GROUPS_TABLE;
const imagesTable = process.env.IMAGES_TABLE;

export const handler: APIGatewayProxyHandler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  console.log('Caller event', event);
  const groupId = event.pathParameters.groupId;
  const validGroupId = await groupExists(groupId);

  if (!validGroupId) {
    return {
      statusCode: 404,
      headers: {
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        error: 'Group does not exist',
      }),
    };
  }
  const imageId = uuid.v4();
  const newImage = await createImage(groupId, imageId, event);
  const s3 = new AWS.S3({
    signatureVersion: 'v4', // Use Sigv4 algorithm
  });
  const presignedUrl = s3.getSignedUrl('putObject', {
    // The URL will allow to perform the PUT operation
    Bucket: process.env.IMAGES_S3_BUCKET, // Name of an S3 bucket
    Key: imageId, // id of an object this URL allows access to
    Expires: '300', // A URL is only valid for 5 minutes
  });

  return {
    statusCode: 201,
    headers: {
      'Access-Control-Allow-Origin': '*',
    },
    body: JSON.stringify({ newImage }),
  };
};

async function groupExists(groupId: string) {
  const result = await docClient
    .get({
      TableName: groupsTable,
      Key: {
        id: groupId,
      },
    })
    .promise();

  console.log('Get group: ', result);
  return !!result.Item;
}

async function createImage(
  groupId: string,
  imageId: string,
  event: APIGatewayProxyEvent
) {
  // TODO: Create an image
  const timestamp = new Date().toISOString();

  const parsedBody = JSON.parse(event.body);
  const newImage = {
    groupId,
    timestamp,
    imageId,
    ...parsedBody,
  };

  await docClient
    .put({
      TableName: imagesTable,
      Item: newImage,
    })
    .promise();

  return newImage;
}
