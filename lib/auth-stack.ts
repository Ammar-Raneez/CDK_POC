import { Stack } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { POCStackProps } from '../resources/lib/poc-stack.model';
import { Cognito } from './app/cognito';

export class AuthStack extends Stack {
  public readonly authorizer: Cognito;

  constructor(scope: Construct, id: string, props: POCStackProps) {
    super(scope, id, props);

    const createdAuthorizer = new Cognito(this, {
      userPoolName: `AuctionUserPool-${props.stageName}`,
      userPoolClientName: `AuctionUPClient-${props.stageName}`,
      userPoolGroupName: `AuctionUPAdminsGroup-${props.stageName}`,
      stageName: props.stageName,
      emailSender: props.emailSender
    });

    this.authorizer = createdAuthorizer;
  }
}
