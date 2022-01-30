import { Stack } from 'aws-cdk-lib';
import { CodePipeline, CodePipelineSource, ShellStep } from 'aws-cdk-lib/pipelines';
import { Construct } from 'constructs';
import { POCStackProps } from '../resources/lib/poc-stack.model';

const REGION = process.env.REGION;
const ACCOUNT = process.env.ACCOUNT;

interface PipelineStackProps extends POCStackProps {
  codeStarConnection: string;
}

export class PipelineStack extends Stack {
  constructor(scope: Construct, id: string, props: PipelineStackProps) {
    super(scope, id, props);

    const pipeline = new CodePipeline(this, `CDKPOCPipeline-${props.stageName}`, {
      pipelineName: `CDKPOCPipeline-${props.stageName}`,
      crossAccountKeys: false,
      synth: new ShellStep(`pipeline-synth-${props.stageName}`, {
        input: CodePipelineSource.connection('Ammar-Raneez/cdk-poc', 'main', {
          connectionArn: `
            arn:aws:codestar-connections:${REGION}:${ACCOUNT}:connection/${props.codeStarConnection}
          `
        }),
        commands: ['npm ci', 'npm run build', 'npx cdk synth']
      })
    });
  }
}
