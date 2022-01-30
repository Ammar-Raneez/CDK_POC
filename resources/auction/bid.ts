import { DynamoDB } from 'aws-sdk';
import {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
  Context,
} from 'aws-lambda';
import { getEventBody } from '../lib/util';
import { validateBidAuction } from '../lib/validator';

const TABLE_NAME = process.env.TABLE_NAME;
const PRIMARY_KEY = process.env.PRIMARY_KEY;
const dbClient = new DynamoDB.DocumentClient();

async function handler(
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> {
  const result: APIGatewayProxyResult = {
    statusCode: 200,
    body: '',
  };

  try {
    const requestBody = getEventBody(event);
    validateBidAuction(requestBody);
    const auctionId = event.queryStringParameters?.[PRIMARY_KEY!];

    if (requestBody && auctionId) {
      const requestBodyKeys = Object.keys(requestBody);
      const requestBodyValues = Object.values(requestBody);

      const updateResult = await dbClient.update({
        TableName: TABLE_NAME!,
        Key: { auctionId },
        UpdateExpression: 'set #zzzNew = :zzNew, #aaaNew = :aaNew',
        ExpressionAttributeValues: {
          ':zzNew': requestBodyValues[0],
          ':aaNew': requestBodyValues[1]
        },
        ExpressionAttributeNames: {
          '#zzzNew': requestBodyKeys[0],
          '#aaaNew': requestBodyKeys[1],
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
