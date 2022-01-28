import {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
  Context,
} from "aws-lambda";
import { DynamoDB } from "aws-sdk";
import { ScanInput } from "aws-sdk/clients/dynamodb";
import { isReport, Report } from "../../types/Report";

const dynamo = new DynamoDB.DocumentClient();

async function handler(
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> {
  let body;
  let statusCode = 200;
  const headers = {
    "Content-Type": "application/json",
  };

  const tableName = process.env.TABLE_NAME;

  try {
    if (!tableName) throw new Error("missing env.TABLE_NAME");
    if (!event.pathParameters) throw new Error("missing path parameter");
    switch (event.pathParameters.query) {
      case "numberOfReports":
        // const tableSize = await calcTableSize("ids-table");
        const tableSize = await dynamoDbReducer(
          tableName,
          (counter) => {
            return (counter += 1);
          },
          0
        );
        body = `report count: ${tableSize} in table ids-table`;
        break;
      case "numberOfVehicles":
        // const numberOfVehicles = await calcVehiclesNum("ids-table");
        const numberOfVehicles = (
          await dynamoDbReducer(
            tableName,
            (set, item) => {
              set.add(item.vehicleId);
              return set;
            },
            new Set()
          )
        ).size;
        body = `number of different vehicles: ${numberOfVehicles}`;
        break;
      case "numberOfAnomalies":
        const numberOfAnomalies = await dynamoDbReducer(
          tableName,
          (counter, item) => {
            if (!isReport(item) || !item) {
              throw new Error("invalid report format");
            }
            Object.values(item.signalsPerMinute).forEach((value) => {
              const { sum, acceptableMinValue, acceptableMaxValue } = value;
              if (sum < acceptableMinValue || sum > acceptableMaxValue) {
                counter += 1;
              }
            });
            return counter;
          },
          0
        );
        body = `number of anomalies found: ${numberOfAnomalies}`;
        break;

      default:
        throw new Error(`Unsupported route: "${event.pathParameters.query}"`);
    }
  } catch (err) {
    statusCode = 400;
    if (err instanceof Error) body = err.message;
  } finally {
    body = JSON.stringify(body);
  }

  return {
    statusCode,
    body,
    headers,
  };
}

async function dynamoDbReducer(
  table: string,
  reducer: (
    previousValue: any,
    currentValue: any,
    currentIndex: number,
    array: any[]
  ) => any,
  initialValue: Object
) {
  let finished = false;
  let LastEvaluatedKey = undefined;
  const itemsList = [];

  while (!finished) {
    const params: DynamoDB.DocumentClient.ScanInput = {
      TableName: table,
    };
    if (LastEvaluatedKey) {
      params.ExclusiveStartKey = LastEvaluatedKey;
    }
    const response = await dynamo.scan(params).promise();
    console.log(response.Items);
    if (response.Items) {
      itemsList.push(...response.Items);
    }
    if (response.LastEvaluatedKey) {
      LastEvaluatedKey = response.LastEvaluatedKey;
    } else {
      finished = true;
    }
  }
  return itemsList.reduce(reducer, initialValue);
}

export { handler };
