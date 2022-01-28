import { aws_s3_notifications, Duration, Stack, StackProps } from "aws-cdk-lib";
import { LambdaIntegration, RestApi } from "aws-cdk-lib/aws-apigateway";
import { AttributeType, Table } from "aws-cdk-lib/aws-dynamodb";
import { PolicyStatement } from "aws-cdk-lib/aws-iam";
import {
  Code,
  Function as LambdaFunction,
  Runtime,
} from "aws-cdk-lib/aws-lambda";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import { Bucket } from "aws-cdk-lib/aws-s3";
import { Construct } from "constructs";
import { join } from "path";
import { GenericTable } from "./GenericTable";

export class CymotiveBackEndStack extends Stack {
  private api = new RestApi(this, "idsgateway");
  // private idsTable = new GenericTable("idstable-cdk", "vehicleId", this)
  private idsTable = new Table(this, "idstable-cdk", {
    tableName: "idstable-cdk",
    partitionKey: {
      name: "vehicleId",
      type: AttributeType.STRING,
    },
    sortKey: {
      name: "modifiedDate",
      type: AttributeType.STRING,
    },
  });

  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const dataLakeBucket = new Bucket(this, "auto-data-lake-cdk", {
      bucketName: "auto-data-lake-cdk",
    });

    const porterLambda = new NodejsFunction(this, "porter", {
      entry: join(__dirname, "../services/porter/index.ts"),
      handler: "handler",
      environment: {
        BUCKET_NAME: dataLakeBucket.bucketName,
      },
    });

    const ingestLambda = new NodejsFunction(this, "ingest", {
      entry: join(__dirname, "../services/ingest/index.ts"),
      handler: "handler",
      environment: {
        BUCKET_NAME: dataLakeBucket.bucketName,
        TABLE_NAME: this.idsTable.tableName,
      },
    });

    const analyzerLambda = new NodejsFunction(this, "analyzer", {
      entry: join(__dirname, "../services/analyzer/index.ts"),
      handler: "handler",
      environment: {
        TABLE_NAME: this.idsTable.tableName,
      },
    });

    dataLakeBucket.grantPut(porterLambda);
    dataLakeBucket.grantRead(ingestLambda);
    this.idsTable.grantWriteData(ingestLambda);
    this.idsTable.grantReadData(analyzerLambda);

    analyzerLambda.addToRolePolicy(
      new PolicyStatement({
        actions: ["dynamodb:Scan"],
        resources: ["*"],
      })
    );

    const notification = new aws_s3_notifications.LambdaDestination(
      ingestLambda
    );
    notification.bind(this, dataLakeBucket);

    dataLakeBucket.addObjectCreatedNotification(notification);

    // const putItemInLakePolicy = new PolicyStatement();
    // putItemInLakePolicy.addActions("s3:PutObject");
    // putItemInLakePolicy.addResources("*");
    // porterLambda.addToRolePolicy(putItemInLakePolicy);

    const autoDataResource = this.api.root.addResource("auto-data");

    const postDataIntegration = new LambdaIntegration(porterLambda);
    autoDataResource.addMethod("POST", postDataIntegration);

    const queryResource = autoDataResource.addResource("{query}");
    const queryDataIntegration = new LambdaIntegration(analyzerLambda);
    queryResource.addMethod("GET", queryDataIntegration);
    // autoDataResource.addMethod("GET", postDataIntegration);

    // const queryResource = autoDataResource.addResource("{query}");
    // queryResource.addMethod("GET", );
  }
}
