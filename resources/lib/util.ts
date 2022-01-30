import { APIGatewayProxyEvent } from 'aws-lambda';

export function generateRandomId() {
  return Math.random().toString(36).slice(2);
}

export function getEventBody(event: APIGatewayProxyEvent) {
  return typeof event.body == 'object' ? event.body : JSON.parse(event.body);
}

export function isAdminAuthorized(event: APIGatewayProxyEvent) {
  const groups = event.requestContext.authorizer?.claims['cognito:groups'];
  if (groups) {
    return (groups as string).includes('AuctionUPAdminsGroup');
  } else {
    return false;
  }
}
