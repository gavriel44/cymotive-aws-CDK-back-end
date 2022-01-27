import { Duration, Stack, StackProps } from "aws-cdk-lib";
import { LambdaIntegration, RestApi } from "aws-cdk-lib/aws-apigateway";
import {
  Code,
  Function as LambdaFunction,
  Runtime,
} from "aws-cdk-lib/aws-lambda";
import { Construct } from "constructs";
import { join } from "path";

export class CymotiveBackEndStack extends Stack {
  api = new RestApi(this, "idsgateway");

  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const porterLambda = new LambdaFunction(this, "porter", {
      runtime: Runtime.NODEJS_14_X,
      code: Code.fromAsset(join(__dirname, "../services/porter")),
      handler: "index.handler",
    });

    const autoDataResource = this.api.root.addResource("auto-data");

    const postDataIntegration = new LambdaIntegration(porterLambda);
    autoDataResource.addMethod("POST", postDataIntegration);

    // const queryResource = autoDataResource.addResource("{query}");
    // queryResource.addMethod("GET", );
  }
}
