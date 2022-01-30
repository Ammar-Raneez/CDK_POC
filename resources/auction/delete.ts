import { DynamoDB } from 'aws-sdk';
import {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
  Context,
} from 'aws-lambda';
import { isAdminAuthorized } from '../lib/util';

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
    const auctionId = event.queryStringParameters?.[PRIMARY_KEY!];

    if (auctionId) {
      const deleteResult = await dbClient.delete({
        TableName: TABLE_NAME!,
        Key: { auctionId }
      }).promise();

      result.body = JSON.stringify(deleteResult);
    }
  } catch (error) {
    result.body = (error as any).message;
  }

  return result;
}

export { handler };
