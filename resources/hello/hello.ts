import { APIGatewayProxyEvent } from 'aws-lambda';
import { isAdminAuthorized } from '../lib/util';

async function handler(event: APIGatewayProxyEvent, context: any) {
  if (isAdminAuthorized(event)) {
    return {
      statusCode: 200,
      body: JSON.stringify('You are authorized')
    };
  }
  return {
    statusCode: 401,
    body: JSON.stringify('You are NOT authorized')
  };
}

export { handler };
