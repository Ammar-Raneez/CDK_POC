import { CfnOutput, Stack } from 'aws-cdk-lib';
import { LambdaIntegration, RestApi } from 'aws-cdk-lib/aws-apigateway';
import { Effect, PolicyStatement } from 'aws-cdk-lib/aws-iam';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Construct } from 'constructs';
import { join } from 'path';
import { POCStackProps } from '../../resources/lib/poc-stack.model';

export class Mailer {
  private api: RestApi;
  private mailerLambda: NodejsFunction;
  private mailerLambdaIntegration: LambdaIntegration;

  public constructor(private scope: Construct, private props: POCStackProps) {
    this.initialize();
  }

  private initialize() {
    this.createRestAPI();
    this.createLambdas();
    this.attachPolicies();
    this.createLambdaIntegrations();
    this.createResources();
  }

  private createRestAPI() {
    this.api = new RestApi(this.scope, `MailerAPI-${this.props.stageName}`, {
      restApiName: `MailerAPI-${this.props.stageName}`,
      deployOptions: {
        stageName: this.props.stageName
      }
    });
  }

  private createLambdas() {
    this.mailerLambda = new NodejsFunction(this.scope, `MailerLambda-${this.props.stageName}`, {
      handler: 'handler',
      functionName: `MailerLambda-${this.props.stageName}`,
      entry: join(__dirname, '..', '..', 'resources', 'mailer', 'sendEmail.ts'),
      environment: {
        EMAIL_SENDER: this.props.emailSender
      },
    });

    new CfnOutput(this.scope, `MailerLambdaArn-${this.props.stageName}`, {
      value: this.mailerLambda.functionArn,
      exportName: `MailerLambdaArn-${this.props.stageName}`
    });
  }

  private attachPolicies() {
    this.mailerLambda.addToRolePolicy(
      new PolicyStatement({
        effect: Effect.ALLOW,
        actions: [
          'ses:SendEmail',
          'ses:SendRawEmail',
          'ses:SendTemplatedEmail',
        ],
        resources: [
          // for ses not in sanboxed environment
          // `arn:aws:ses:${Stack.of(this.scope).region}:${Stack.of(this.scope).account}:identity/${this.props.emailSender}`,
          `arn:aws:ses:${Stack.of(this.scope).region}:${Stack.of(this.scope).account}:identity/*`,
        ],
      }),
    );
  }

  private createLambdaIntegrations() {
    this.mailerLambdaIntegration = new LambdaIntegration(this.mailerLambda);
  }

  private createResources() {
    const mailLambdaResource = this.api.root.addResource('mail');
    mailLambdaResource.addMethod('POST', this.mailerLambdaIntegration);
  }
}
