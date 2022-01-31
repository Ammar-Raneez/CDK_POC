import {
  CognitoUserPoolsAuthorizer,
  LambdaIntegration,
  MethodOptions,
  RestApi
} from 'aws-cdk-lib/aws-apigateway';
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
  // private helloLambda: LbFunction;
  private helloLambdaTypeScript: NodejsFunction;
  // private helloLambdaIntegration: LambdaIntegration;
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
    // this.helloLambda = new LbFunction(this.scope, `helloLambda-${this.props.stageName}`, {
    //   runtime: Runtime.NODEJS_14_X,
    //   code: Code.fromAsset(join(__dirname, '..', '..', 'resources', 'hello')),
    //   handler: 'hello.main',
    //   functionName: `auction-hello-${this.props.stageName}`
    // });
    this.helloLambdaTypeScript = new NodejsFunction(this.scope, `helloLambdaTypeScript-${this.props.stageName}`, {
      entry: join(__dirname, '..', '..', 'resources', 'hello', 'hello.ts'),
      handler: 'handler',
      functionName: `auction-hello-ts-${this.props.stageName}`
    });
  }

  private createLambdaIntegrations() {
    // this.helloLambdaIntegration = new LambdaIntegration(this.helloLambda);
    this.helloLambdaTSIntegration = new LambdaIntegration(this.helloLambdaTypeScript);
  }

  private createResources() {
    // const helloLambdaResource = this.api.root.addResource('hello');
    const helloLambdaTSResource = this.api.root.addResource('hello-ts');
    // helloLambdaResource.addMethod('GET', this.helloLambdaIntegration, this.props.authorizerOptions);
    helloLambdaTSResource.addMethod('GET', this.helloLambdaTSIntegration, this.props.authorizerOptions);
  }
}
