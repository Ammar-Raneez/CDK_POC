import { SecretValue, Stack } from 'aws-cdk-lib';
import { BuildSpec, LinuxBuildImage, PipelineProject } from 'aws-cdk-lib/aws-codebuild';
import { Artifact, Pipeline } from 'aws-cdk-lib/aws-codepipeline';
import { CloudFormationCreateUpdateStackAction, CodeBuildAction, GitHubSourceAction } from 'aws-cdk-lib/aws-codepipeline-actions';
import { Construct } from 'constructs';
import { POCStackProps } from '../resources/lib/poc-stack.model';

interface PipelineStackProps extends POCStackProps {
  codeStarConnection: string;
}

export class PipelineStack extends Stack {
  private readonly pipeline: Pipeline;
  private readonly buildOutput: Artifact;

  constructor(scope: Construct, id: string, props: PipelineStackProps) {
    super(scope, id, props);

    // AWS CDK docs solution
    // const pipeline = new CodePipeline(this, `CDKPOCPipeline-${props.stageName}`, {
		// 	pipelineName: `CDKPOCPipeline-${props.stageName}`,
		// 	synth: new CodeBuildStep(`PipelineSynth-${props.stageName}`, {
		// 		input: CodePipelineSource.connection('Ammar-Raneez/cdk-poc', 'main', {
    //       connectionArn: props.codeStarConnection
    //     }),
		// 		installCommands: ['npm install -g aws-cdk'],
		// 		commands: ['npm ci', 'npm run build', 'npx cdk synth']
		// 	})
		// });

    this.pipeline = new Pipeline(this, `CDKPOCPipeline-${props.stageName}`, {
      pipelineName: `CDKPOCPipeline-${props.stageName}`,
      crossAccountKeys: false,
      restartExecutionOnUpdate: true
    });

    // place stage outputs in artifacts
    const sourceOutput = new Artifact(`source-output-${props.stageName}`);

    // connect to github repo
    this.pipeline.addStage({
      stageName: `source-${props.stageName}`,
      actions: [
        new GitHubSourceAction({
          owner: 'Ammar-Raneez',
          repo: 'cdk-poc',
          branch: 'main',
          actionName: `Pipeline-Source-${props.stageName}`,
          oauthToken: SecretValue.secretsManager('CDK_POC_PIPELINE'),
          output: sourceOutput
        })
      ]
    });

    this.buildOutput = new Artifact(`build-output-${props.stageName}`);

    // build process
    this.pipeline.addStage({
      stageName: `build-${props.stageName}`,
      actions: [
        new CodeBuildAction({
          input: sourceOutput,
          outputs: [this.buildOutput],
          actionName: `Pipeline-Build-${props.stageName}`,
          project: new PipelineProject(this, `CDKPOCBuildProject-${props.stageName}`, {
            environment: {
              buildImage: LinuxBuildImage.STANDARD_5_0,
              privileged: true      // allow docker daemon to build this project
            },
            buildSpec: BuildSpec.fromSourceFilename('build-spec/cdk-build-spec.yml')
          })
        })
      ]
    });

    // update pipeline automatically
    this.pipeline.addStage({
      stageName: `update-${props.stageName}`,
      actions: [
        new CloudFormationCreateUpdateStackAction({
          actionName: `Pipeline-Update-${props.stageName}`,
          stackName: 'CdkPocPipelineStack',
          templatePath: this.buildOutput.atPath('CdkPocPipelineStack.template.json'),
          adminPermissions: true
        })
      ]
    })
  }

  public addServiceStack(stack: Stack, stageName: string, props: POCStackProps) {
    this.pipeline.addStage({
      stageName: `${stageName.toLowerCase()}-${props.stageName}`,
      actions: [
        new CloudFormationCreateUpdateStackAction({
          actionName: `Service-${stageName}-${props.stageName}`,
          stackName: stack.stackName,
          templatePath: this.buildOutput.atPath(`${stack.stackName}.template.json`),
          adminPermissions: true
        })
      ]
    })
  }
}
