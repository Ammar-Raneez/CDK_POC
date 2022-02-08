import { DynamoDB, S3 } from 'aws-sdk';
import {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
  Context,
} from 'aws-lambda';
import { generateRandomId, getEventBody, isAdminAuthorized } from '../lib/util';
import { MissingFieldError, validateCreateAuction } from '../lib/validator';
import { AuctionStatus } from '../lib/auction-status.enum';

const TABLE_NAME = process.env.TABLE_NAME;
const BUCKET_NAME = process.env.BUCKET_NAME!;
const dbClient = new DynamoDB.DocumentClient();
const s3 = new S3();

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
    const item = getEventBody(event);
    console.log('Item: ', JSON.stringify(item));
    const currentTime = new Date();
    const endTime = new Date();
    endTime.setHours(currentTime.getHours() + 1);

    item.auctionId = generateRandomId();
    item.status = AuctionStatus.OPEN;
    item.currentTime = currentTime.toISOString();
    item.endTime = endTime.toISOString();
    item.amount = 0;

    const imageBuffer =  item.image.replace(/^data:image\/\w+;base64,/, '');
    const imageRes = await uploadImageToS3(item.auctionId + '.jpg', imageBuffer);
    item.image = imageRes.Location;
    validateCreateAuction(item);

    await dbClient
      .put({
        TableName: TABLE_NAME!,
        Item: item,
      })
      .promise();

    result.body = JSON.stringify(`Created item with id: ${item.auctionId}`);
  } catch (error) {
    if (error instanceof MissingFieldError) {
      result.statusCode = 403;
    } else {
      result.statusCode = 500;
    }

    result.body = (error as any).message;
  }

  return result;
}

export { handler };

const uploadImageToS3 = async (key: string, body: S3.Body) => {
  const result = await s3.upload({
    Bucket: BUCKET_NAME,
    Key: key,
    Body: body,
    ContentEncoding: 'base64',
    ContentType: 'image/jpeg',
  }).promise();

  return result;
}