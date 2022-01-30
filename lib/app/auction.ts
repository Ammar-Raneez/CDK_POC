import {
  CognitoUserPoolsAuthorizer,
  MethodOptions,
  RestApi
} from 'aws-cdk-lib/aws-apigateway';
import { Construct } from 'constructs';
import { POCStackProps } from '../../resources/lib/poc-stack.model';
import { DynamoDB } from './dynamodb';

interface AuctionProps extends POCStackProps {
  readonly authorizer: CognitoUserPoolsAuthorizer;
  readonly authorizerOptions: MethodOptions;
  readonly auctionTable: DynamoDB;
}

export class Auction {
  private api: RestApi;

  public constructor(private scope: Construct, private props: AuctionProps) {
    this.initialize();
  }

  private initialize() {
    this.createRestAPI();
    this.createResources();
  }

  private createRestAPI() {
    this.api = new RestApi(this.scope, `AuctionAPI-${this.props.stageName}`, {
      restApiName: `AuctionAPI-${this.props.stageName}`,
      deployOptions: {
        stageName: this.props.stageName
      }
    });

    this.props.authorizer._attachToApi(this.api);
  }

  private createResources() {
    const auctionLambdaResource = this.api.root.addResource('auction');
    auctionLambdaResource.addMethod('GET', this.props.auctionTable.readlambdaIntegration);
    auctionLambdaResource.addMethod('PATCH', this.props.auctionTable.patchlambdaIntegration);
    auctionLambdaResource.addMethod(
      'POST',
      this.props.auctionTable.createlambdaIntegration,
      this.props.authorizerOptions
    );
    auctionLambdaResource.addMethod(
      'PUT',
      this.props.auctionTable.updatelambdaIntegration,
      this.props.authorizerOptions
    );
    auctionLambdaResource.addMethod(
      'DELETE',
      this.props.auctionTable.deletelambdaIntegration,
      this.props.authorizerOptions
    );
  }
}
