import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { AuthStack } from '../lib/auth-stack';
import { MailerStack } from '../lib/mailer-stack';
import { HelloStack } from '../lib/hello-stack';
import { AuctionStack } from '../lib/auction-stack';
import { PipelineStack } from '../lib/pipeline-stack';

const app = new cdk.App();
const authStack = new AuthStack(app, 'CdkPocAuthStack', {
  stackName: 'CdkPocAuthStack',
  stageName: 'dev',
  emailSender: 'ammarraneez@gmail.com'
});

const mailerStack = new MailerStack(app, 'CdkPocMailerStack', {
  stackName: 'CdkPocMailerStack',
  stageName: 'dev',
  emailSender: 'ammarraneez@gmail.com'
});

const helloStack = new HelloStack(app, 'CdkPocHelloStack', {
  stackName: 'CdkPocHelloStack',
  stageName: 'dev',
  emailSender: 'ammarraneez@gmail.com'
});

const auctionStack = new AuctionStack(app, 'CdkPocAuctionStack', {
  stackName: 'CdkPocAuctionStack',
  stageName: 'dev',
  emailSender: 'ammarraneez@gmail.com'
});

const pipelineStack = new PipelineStack(app, 'CdkPocPipelineStack', {
  stackName: 'CdkPocPipelineStack',
  stageName: 'dev',
  emailSender: 'ammarraneez@gmail.com',
  codeStarConnection: 'e95f7f83-2072-419f-bb2b-c8a4cd3aae61',
  env: {
    account: '634590378560',
    region: 'us-east-1'
  }
});
pipelineStack.addServiceStack(authStack, 'Auth', {
  stackName: 'CdkPocAuthStack',
  stageName: 'dev',
  emailSender: 'ammarraneez@gmail.com'
});
pipelineStack.addServiceStack(mailerStack, 'Mailer', {
  stackName: 'CdkPocMailerStack',
  stageName: 'dev',
  emailSender: 'ammarraneez@gmail.com'
});
pipelineStack.addServiceStack(helloStack, 'Hello', {
  stackName: 'CdkPocHelloStack',
  stageName: 'dev',
  emailSender: 'ammarraneez@gmail.com'
});
pipelineStack.addServiceStack(auctionStack, 'Auction', {
  stackName: 'CdkPocAuctionStack',
  stageName: 'dev',
  emailSender: 'ammarraneez@gmail.com'
});
