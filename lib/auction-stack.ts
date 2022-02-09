import { Fn, Stack, aws_s3 as s3 } from 'aws-cdk-lib';
import { AuthorizationType, CognitoUserPoolsAuthorizer, MethodOptions } from 'aws-cdk-lib/aws-apigateway';
import { UserPool } from 'aws-cdk-lib/aws-cognito';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { StateMachine, Succeed } from 'aws-cdk-lib/aws-stepfunctions';
import { LambdaInvoke } from 'aws-cdk-lib/aws-stepfunctions-tasks';
import { Construct } from 'constructs';
import { join } from 'path';
import { POCStackProps } from '../resources/lib/poc-stack.model';
import { Auction } from './app/auction';
import { DynamoDB } from './app/dynamodb';

export class AuctionStack extends Stack {
  constructor(scope: Construct, id: string, props: POCStackProps) {
    super(scope, id, props);
    const userPool = UserPool.fromUserPoolId(this, 'AuctionUP',
      Fn.importValue(`UPId-${props.stageName}`).toString()
    );
    const authorizer = new CognitoUserPoolsAuthorizer(this, `AuctionAuthorizer-${props.stageName}`, {
      authorizerName: `AuctionAuthorizer-${props.stageName}`,
      cognitoUserPools: [userPool],
      identitySource: 'method.request.header.Authorization'
    });
    const authorizerAuctionOptions: MethodOptions = {
      authorizationType: AuthorizationType.COGNITO,
      authorizer: {
        authorizerId: authorizer.authorizerId
      }
    };

    // const auctionBucket = new s3.Bucket(this, `AuctionBucket-${props.stageName}`, {
    //   bucketName: `auction-bucket-${props.stageName}`,
    //   accessControl: s3.BucketAccessControl.PUBLIC_READ,
    //   publicReadAccess: true,
    // });
    const auctionTable = new DynamoDB(
      this,
      {
        tableName: `AuctionTable-${props.stageName}`,
        primaryKey: 'auctionId',
        createLambdaPath: 'create',
        readLambdaPath: 'read',
        updateLambdaPath: 'update',
        deleteLambdaPath: 'delete',
        patchLambdaPath: 'bid',
        secondaryIndexes: [{ partition: 'status' }, { partition: 'status', sort: 'endTime' }],
        // environment: {
        //   s3: auctionBucket.bucketName
        // }
      }
    );
    new Auction(this, {
      auctionTable,
      authorizer,
      authorizerOptions: authorizerAuctionOptions,
      stageName: props.stageName,
      emailSender: props.emailSender,
    });

    const mailerLambda = NodejsFunction.fromFunctionArn(this, 'MailerAuctionId',
      Fn.importValue(`MailerLambdaArn-${props.stageName}`).toString()
    );
    const closeAuctionLambda = new NodejsFunction(this, `CloseAuctionLambda-${props.stageName}`, {
      entry: join(__dirname, '..', 'resources', 'auction', 'close.ts'),
      handler: 'handler',
      functionName: `close-auction-${props.stageName}`,
      environment: {
        TABLE_NAME: `AuctionTable-${props.stageName}`
      }
    });
    auctionTable.grantAccess(closeAuctionLambda, ['read', 'write']);
    const closeAuctionStateMachine = new StateMachine(this, `CloseAuctionStateMachine-${props.stageName}`, {
      stateMachineName: `CloseAuctionStateMachine-${props.stageName}`,
      definition: new LambdaInvoke(this, `CloseAuctionLambdaTask-${props.stageName}`, {
        lambdaFunction: closeAuctionLambda,
      }).next(new LambdaInvoke(this, `SendAuctionEmailLambdaTask-${props.stageName}`, {
        lambdaFunction: mailerLambda,
      })).next(new Succeed(this, `AuctionStateMachineSuccess-${props.stageName}`))
    });

    // Cron job, runs state machine every 1 minute
    // new Rule(this, `CloseAuctionStateRule-${props.stageName}`, {
    //   ruleName: `CloseAuctionStateRule-${props.stageName}`,
    //   schedule: Schedule.rate(Duration.minutes(1)),
    //   targets: [new SfnStateMachine(closeAuctionStateMachine)]
    // });
  }
}
