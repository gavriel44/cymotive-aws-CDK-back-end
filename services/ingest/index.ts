import { Context, S3CreateEvent } from "aws-lambda";
import { DynamoDB, S3 } from "aws-sdk";

const s3 = new S3();

const ddbClient = new DynamoDB.DocumentClient();

async function handler(event: S3CreateEvent, context: Context) {
  //console.log('Received event:', JSON.stringify(event, null, 2));

  // Get the object from the event and show its content type
  const bucket = event.Records[0].s3.bucket.name;
  const key = decodeURIComponent(
    event.Records[0].s3.object.key.replace(/\+/g, " ")
  );
  const params = {
    Bucket: bucket,
    Key: key,
  };
  try {
    const { Body } = await s3.getObject(params).promise();
    if (!Body) throw new Error("Body is undefined");
    console.log("-------", JSON.parse(Body.toString("utf-8")));
    const entry = JSON.parse(Body.toString("utf-8"));

    const table = process.env.TABLE_NAME;
    if (!table) throw new Error("table name missing");

    const params2 = {
      TableName: table,
      Item: entry,
    };

    console.log("Adding a new item...");
    await ddbClient.put(params2).promise();
    return "proccess succesfull";
  } catch (err) {
    console.log(err);
    const message = `Error getting object ${key} from bucket ${bucket}. Make sure they exist and your bucket is in the same region as this function.`;
    console.log(message);
    throw new Error(message);
  }
}

export { handler };
