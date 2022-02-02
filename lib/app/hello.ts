import { Duration } from 'aws-cdk-lib';
import {
  CognitoUserPoolsAuthorizer,
  LambdaIntegration,
  MethodOptions,
  RestApi
} from 'aws-cdk-lib/aws-apigateway';
import { Statistic, TreatMissingData } from 'aws-cdk-lib/aws-cloudwatch';
import {
  LambdaDeploymentConfig,
  LambdaDeploymentGroup
} from 'aws-cdk-lib/aws-codedeploy';
import { Alias } from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Construct } from 'constructs';
import { join } from 'path';
import { POCStackProps } from '../../resources/lib/poc-stack.model';

interface HelloProps extends POCStackProps {
  readonly authorizer: CognitoUserPoolsAuthorizer;
  readonly authorizerOptions: MethodOptions;
}

export class Hello {
  private api: RestApi;
  private helloLambdaTypeScript: NodejsFunction;
  private helloLambdaTypeScriptAlias: Alias;
  private helloLambdaTSIntegration: LambdaIntegration;

  public constructor(private scope: Construct, private props: HelloProps) {
    this.initialize();
  }

  private initialize() {
    this.createRestAPI();
    this.createLambdas();
    this.createLambdaIntegrations();
    this.createResources();
  }

  private createRestAPI() {
    this.api = new RestApi(this.scope, `HelloAPI-${this.props.stageName}`, {
      restApiName: `HelloAPI-${this.props.stageName}`,
      deployOptions: {
        stageName: this.props.stageName
      }
    });

    this.props.authorizer._attachToApi(this.api);
  }

  private createLambdas() {
    this.helloLambdaTypeScript = new NodejsFunction(this.scope, `helloLambdaTypeScript-${this.props.stageName}`, {
      entry: join(__dirname, '..', '..', 'resources', 'hello', 'hello.ts'),
      handler: 'handler',
      functionName: `auction-hello-ts-${this.props.stageName}`,

      // Intentionally added to trigger hello stack build
      description: `Generated on ${new Date().toISOString()}`
    });

    this.helloLambdaTypeScriptAlias = new Alias(this.scope, `helloLambdaTypeScriptAlias-${this.props.stageName}`, {
      version: this.helloLambdaTypeScript.currentVersion,
      aliasName: `helloLambdaTypeScriptAlias-${this.props.stageName}`
    });
  }

  private createLambdaIntegrations() {
    this.helloLambdaTSIntegration = new LambdaIntegration(this.helloLambdaTypeScriptAlias);
    new LambdaDeploymentGroup(this.scope, `helloLambdaTypeScriptDG-${this.props.stageName}`, {
      alias: this.helloLambdaTypeScriptAlias,
      deploymentGroupName: `helloLambdaTypeScriptDG-${this.props.stageName}`,
      deploymentConfig: LambdaDeploymentConfig.CANARY_10PERCENT_5MINUTES,

      // rollback all traffic to old version on specified alarms
      autoRollback: {
        deploymentInAlarm: true
      },
      alarms: [
        this.api.metricServerError()
          .with({
            period: Duration.minutes(1),
            statistic: Statistic.SUM
          })
          .createAlarm(this.scope, `ServiceErrorAlarm-${this.props.stageName}`, {
            threshold: 1,
            alarmDescription: 'Hello Service is experiencing an error',
            alarmName: `ServiceErrorAlarm-${this.props.stageName}`,
            evaluationPeriods: 1,
            treatMissingData: TreatMissingData.NOT_BREACHING
          })
      ]
    });
  }

  private createResources() {
    const helloLambdaTSResource = this.api.root.addResource('hello-ts');
    helloLambdaTSResource.addMethod('GET', this.helloLambdaTSIntegration, this.props.authorizerOptions);
  }
}
