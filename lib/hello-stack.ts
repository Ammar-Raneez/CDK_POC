import { Fn, Stack } from 'aws-cdk-lib';
import { AuthorizationType, CognitoUserPoolsAuthorizer, MethodOptions } from 'aws-cdk-lib/aws-apigateway';
import { UserPool } from 'aws-cdk-lib/aws-cognito';
import { Construct } from 'constructs';
import { POCStackProps } from '../resources/lib/poc-stack.model';
import { Hello } from './app/hello';

export class HelloStack extends Stack {
  constructor(scope: Construct, id: string, props: POCStackProps) {
    super(scope, id, props);
    const userPool = UserPool.fromUserPoolId(this, 'HelloUP',
      Fn.importValue(`UPId-${props.stageName}`).toString()
    );
    const authorizer = new CognitoUserPoolsAuthorizer(this, `HelloAuthorizer-${props.stageName}`, {
      authorizerName: `HelloAuthorizer-${props.stageName}`,
      cognitoUserPools: [userPool],
      identitySource: 'method.request.header.Authorization'
    });

    const authorizerHelloOptions: MethodOptions = {
      authorizationType: AuthorizationType.COGNITO,
      authorizer: {
        authorizerId: authorizer.authorizerId
      }
    };

    new Hello(this, {
      authorizer,
      authorizerOptions: authorizerHelloOptions,
      stageName: props.stageName,
      emailSender: props.emailSender
    });
  }
}
