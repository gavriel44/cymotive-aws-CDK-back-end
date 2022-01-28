import {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
  Context,
} from "aws-lambda";
import { v4 as uuidv4 } from "uuid";
import { S3 } from "aws-sdk";
import { PutObjectAclRequest, PutObjectRequest } from "aws-sdk/clients/s3";

const s3 = new S3();

async function handler(
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> {
  console.log("inside porter");
  console.log(event);
  const response = {
    statusCode: 200,
    body: "success",
  };

  const bucketName = process.env.BUCKET_NAME;
  if (!bucketName) return { statusCode: 500, body: "bucket not specified" };
  if (!event.body) return { statusCode: 401, body: "must have data" };

  const params: PutObjectRequest = {
    Bucket: bucketName,
    Key: uuidv4() + ".json",
    Body: event.body,
  };

  try {
    const res = await s3.putObject(params).promise();
    console.log("res: ", res);
    /* code */
  } catch (e) {
    console.log(e);

    response.statusCode = 500;
    response.body = JSON.stringify(e);
  }

  return response;
}

// handler(
//   {
//     body: JSON.stringify({
//       vehicleId: "e252d236-a830-5438-88e3-420aff355d2b",
//       label: "VW Polo",
//       modifiedDate: "2075-04-29T03:58:11.803Z",
//       manufacturerType: "VW",
//       manufacturerTitle: "Polo",
//       signalsPerMinute: {
//         infotainment: {
//           canId: 11,
//           busId: 50,
//           acceptableMinValue: 2,
//           acceptableMaxValue: 17,
//           sum: 12,
//         },
//         windows: {
//           canId: 46,
//           busId: 12,
//           acceptableMinValue: 522,
//           acceptableMaxValue: 578,
//           sum: 580,
//         },
//         airBag: {
//           canId: 80,
//           busId: 6,
//           acceptableMinValue: 3,
//           acceptableMaxValue: 8,
//           sum: 6,
//         },
//       },
//     }),
//   } as any,
//   {} as any
// ).then(console.log);

export { handler };
