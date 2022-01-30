import { CfnOutput } from 'aws-cdk-lib';
import { CognitoUserPoolsAuthorizer } from 'aws-cdk-lib/aws-apigateway';
import { CfnUserPoolGroup, UserPool, UserPoolClient } from 'aws-cdk-lib/aws-cognito';
import { Construct } from 'constructs';
import { POCStackProps } from '../../resources/lib/poc-stack.model';

interface CognitoProps extends POCStackProps {
  userPoolName: string;
  userPoolClientName: string;
  userPoolGroupName: string;
}

export class Cognito {
  private userPool: UserPool;
  private userPoolClient: UserPoolClient;

  constructor(private scope: Construct, private props: CognitoProps) {
    this.initialize();
  }

  public createAuthorizer(userPoolAuthorizerName: string) {
    return new CognitoUserPoolsAuthorizer(this.scope, `${userPoolAuthorizerName}`, {
      cognitoUserPools: [this.userPool],
      authorizerName: `${userPoolAuthorizerName}`,
      identitySource: 'method.request.header.Authorization'
    });
  }

  private initialize() {
    this.createUserPool();
    this.createUPAppClient();
    this.createAdminsGroup();
  }

  private createUserPool() {
    this.userPool = new UserPool(this.scope, `${this.props.userPoolName}`, {
      userPoolName: `${this.props.userPoolName}`,
      selfSignUpEnabled: true,
      signInAliases: {
        username: true,
        email: true
      }
    });

    new CfnOutput(this.scope, `UPId-${this.props.stageName}`, {
      value: this.userPool.userPoolId,
      exportName: `UPId-${this.props.stageName}`
    });
  }

  private createUPAppClient() {
    this.userPoolClient = this.userPool.addClient(`${this.props.userPoolClientName}`, {
      userPoolClientName: `${this.props.userPoolClientName}`,
      authFlows: {
        adminUserPassword: true,
        custom: true,
        userPassword: true,
        userSrp: true,
      },
      generateSecret: false,
    });

    new CfnOutput(this.scope, `UPClientId-${this.props.stageName}`, {
      value: this.userPoolClient.userPoolClientId,
      exportName: `UPClientId-${this.props.stageName}`
    });
  }

  private createAdminsGroup() {
    new CfnUserPoolGroup(this.scope, `${this.props.userPoolGroupName}`, {
      groupName: `${this.props.userPoolGroupName}`,
      userPoolId: this.userPool.userPoolId
    });
  }
}
