import { StackProps } from 'aws-cdk-lib';

export interface POCStackProps extends StackProps {
  readonly stageName: string;
  readonly emailSender: string;
}
