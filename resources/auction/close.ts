import { DynamoDB } from 'aws-sdk';
import {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
  Context,
} from 'aws-lambda';
import { AuctionStatus } from '../lib/auction-status.enum';

const TABLE_NAME = process.env.TABLE_NAME!;
const dbClient = new DynamoDB.DocumentClient();

async function handler(event: APIGatewayProxyEvent, context: Context) {
  const result: APIGatewayProxyResult = {
    statusCode: 200,
    body: '',
  };

  try {
    const auctionsToClose = await getToCloseAuctions();
    console.log('auctionsToClose: ', auctionsToClose);
    const auctionsToClosePromises = auctionsToClose?.map((auction) => (
      closeAuction(auction.auctionId)
    ));

    await Promise.all(auctionsToClosePromises!);
    result.body = JSON.stringify({ auctionsToClose });
  } catch (error) {
    result.body = (error as any).message;
  }

  return JSON.parse(JSON.stringify(result.body));
}

export { handler };

async function getToCloseAuctions() {
  const now = new Date();

  const params = {
    TableName: TABLE_NAME,
    IndexName: 'statusAndendTime',
    KeyConditionExpression: '#status = :status AND endTime <= :now',
    ExpressionAttributeValues: {
      ':status': AuctionStatus.OPEN,
      ':now': now.toISOString(),
    },
    ExpressionAttributeNames: {
      '#status': 'status',
    },
  };

  const result = await dbClient.query(params).promise();
  return result.Items;
}

async function closeAuction(auctionId: string) {
  const params = {
    TableName: TABLE_NAME,
    Key: { auctionId },

    UpdateExpression: 'set #status = :status',
    ExpressionAttributeValues: {
      ':status': AuctionStatus.CLOSED,
    },
    ExpressionAttributeNames: {
      '#status': 'status',
    },
  }

  await dbClient.update(params).promise();
}
