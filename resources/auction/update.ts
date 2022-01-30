import { DynamoDB } from 'aws-sdk';
import {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
  Context,
} from 'aws-lambda';
import { getEventBody, isAdminAuthorized } from '../lib/util';

const TABLE_NAME = process.env.TABLE_NAME;
const PRIMARY_KEY = process.env.PRIMARY_KEY;
const dbClient = new DynamoDB.DocumentClient();

async function handler(
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> {
  if (!isAdminAuthorized(event)) {
    return {
      statusCode: 401,
      body: JSON.stringify('You do not have permission to perform this action.'),
    }
  }

  const result: APIGatewayProxyResult = {
    statusCode: 200,
    body: '',
  };

  try {
    const requestBody = getEventBody(event);
    const auctionId = event.queryStringParameters?.[PRIMARY_KEY!];

    if (requestBody && auctionId) {
      const requestBodyKey = Object.keys(requestBody)[0];
      const requestBodyValue = requestBody[requestBodyKey];

      const updateResult = await dbClient.update({
        TableName: TABLE_NAME!,
        Key: { auctionId },
        UpdateExpression: 'set #zzzNew = :zzNew',
        ExpressionAttributeValues: {
          ':zzNew': requestBodyValue
        },
        ExpressionAttributeNames: {
          '#zzzNew': requestBodyKey
        },
        ReturnValues: 'UPDATED_NEW'
      }).promise();

      result.body = JSON.stringify(updateResult);
    }
  } catch (error) {
    result.body = (error as any).message;
  }

  return result;
}

export { handler };
