import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';

const region = process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || 'us-east-1';
const endpoint = process.env.DYNAMODB_ENDPOINT;

export const TABLE_NAME = process.env.DYNAMODB_TABLE_NAME || 'nudge_tasks';

// Check if AWS credentials or custom endpoint are provided
export const isDynamoConfigured = Boolean(
  (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) ||
    process.env.DYNAMODB_ENDPOINT ||
    process.env.AWS_PROFILE
);

const baseClient = new DynamoDBClient({
  region,
  ...(endpoint ? { endpoint } : {}),
});

export const docClient = DynamoDBDocumentClient.from(baseClient, {
  marshallOptions: {
    removeUndefinedValues: true,
    convertClassInstanceToMap: true,
  },
  unmarshallOptions: {
    wrapNumbers: false,
  },
});
