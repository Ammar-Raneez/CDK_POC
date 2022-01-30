import { Stack } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { POCStackProps } from '../resources/lib/poc-stack.model';
import { Mailer } from './app/mailer';

export class MailerStack extends Stack {
  public readonly mailer: Mailer;

  constructor(scope: Construct, id: string, props: POCStackProps) {
    super(scope, id, props);

    const createdMailer = new Mailer(this, {
      stageName: props.stageName,
      emailSender: props.emailSender
    });

    this.mailer = createdMailer;
  }
}
