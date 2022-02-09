import { LambdaIntegration } from 'aws-cdk-lib/aws-apigateway';
import { AttributeType, Table } from 'aws-cdk-lib/aws-dynamodb';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Bucket } from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';
import { join } from 'path';

export interface GSI {
  sort?: string;
  partition: string;
}

interface TableProps {
  tableName: string;
  primaryKey: string;
  createLambdaPath?: string;
  readLambdaPath?: string;
  updateLambdaPath?: string;
  patchLambdaPath?: string;
  deleteLambdaPath?: string;
  secondaryIndexes?: GSI[];
  environment?: {
    s3: {
      bucket: Bucket;
      bucketName: string;
    }
  };
}

export class DynamoDB {
  private table: Table;

  private createLambda: NodejsFunction | undefined;
  private readLambda: NodejsFunction | undefined;
  private updateLambda: NodejsFunction | undefined;
  private patchLambda: NodejsFunction | undefined;
  private deleteLambda: NodejsFunction | undefined;

  public createlambdaIntegration: LambdaIntegration;
  public readlambdaIntegration: LambdaIntegration;
  public updatelambdaIntegration: LambdaIntegration;
  public patchlambdaIntegration: LambdaIntegration;
  public deletelambdaIntegration: LambdaIntegration;

  public constructor(private scope: Construct, private props: TableProps) {
    this.initialize();
  }

  public grantAccess(lambda: NodejsFunction, permissions: string[]) {
    permissions.forEach((permission) => {
      switch (permission) {
        case 'read':
          this.table.grantReadData(lambda);
          break;
        case 'write':
          this.table.grantWriteData(lambda);
          break;
      }
    });
  }

  private initialize() {
    this.createTable();
    this.addSecondaryIndexes();
    this.createLambdas();
    this.grantDynamoDBRights();
  }

  private createTable() {
    this.table = new Table(this.scope, this.props.tableName, {
      partitionKey: {
        name: this.props.primaryKey,
        type: AttributeType.STRING,
      },
      tableName: this.props.tableName,
    });
  }

  private addSecondaryIndexes() {
    if (this.props.secondaryIndexes) {
      for (const secondaryIndex of this.props.secondaryIndexes) {
        if (secondaryIndex.sort) {
          this.table.addGlobalSecondaryIndex({
            indexName: secondaryIndex.partition + 'And' + secondaryIndex.sort,
            partitionKey: {
              name: secondaryIndex.partition,
              type: AttributeType.STRING
            },
            sortKey: {
              name: secondaryIndex.sort,
              type: AttributeType.STRING
            }
          });
        } else {
          this.table.addGlobalSecondaryIndex({
            indexName: secondaryIndex.partition,
            partitionKey: {
              name: secondaryIndex.partition,
              type: AttributeType.STRING
            }
          });
        }
      }
    }
  }

  private createLambdas() {
    if (this.props.createLambdaPath) {
      this.createLambda = this.createSingleLambda(this.props.createLambdaPath);
      this.createlambdaIntegration = new LambdaIntegration(this.createLambda);
    }

    if (this.props.readLambdaPath) {
      this.readLambda = this.createSingleLambda(this.props.readLambdaPath);
      this.readlambdaIntegration = new LambdaIntegration(this.readLambda);
    }

    if (this.props.updateLambdaPath) {
      this.updateLambda = this.createSingleLambda(this.props.updateLambdaPath);
      this.updatelambdaIntegration = new LambdaIntegration(this.updateLambda);
    }

    if (this.props.patchLambdaPath) {
      this.patchLambda = this.createSingleLambda(this.props.patchLambdaPath);
      this.patchlambdaIntegration = new LambdaIntegration(this.patchLambda);
    }

    if (this.props.deleteLambdaPath) {
      this.deleteLambda = this.createSingleLambda(this.props.deleteLambdaPath);
      this.deletelambdaIntegration = new LambdaIntegration(this.deleteLambda);
    }
  }

  private grantDynamoDBRights() {
    if (this.createLambda) {
      this.table.grantWriteData(this.createLambda);
      this.props.environment?.s3.bucket.grantWrite(this.createLambda);
    }

    if (this.readLambda) {
      this.table.grantReadData(this.readLambda);
    }

    if (this.updateLambda) {
      this.table.grantWriteData(this.updateLambda);
    }

    if (this.patchLambda) {
      this.table.grantWriteData(this.patchLambda);
    }

    if (this.deleteLambda) {
      this.table.grantWriteData(this.deleteLambda);
    }
  }

  private createSingleLambda(lambdaName: string): NodejsFunction {
    const lambdaId = this.props.tableName.toLowerCase() + '-' + lambdaName;
    return new NodejsFunction(this.scope, lambdaId, {
      entry: join(
        __dirname,
        '..',
        '..',
        'resources',
        'auction',
        `${lambdaName}.ts`
      ),
      handler: 'handler',
      functionName: lambdaId,
      environment: {
        TABLE_NAME: this.props.tableName,
        PRIMARY_KEY: this.props.primaryKey,
        BUCKET_NAME: this.props.environment!.s3.bucketName
      }
    });
  }
}
