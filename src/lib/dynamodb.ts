import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';

const accessKeyId =
  process.env.APP_AWS_ACCESS_KEY_ID ||
  process.env.AWS_ACCESS_KEY_ID;

const secretAccessKey =
  process.env.APP_AWS_SECRET_ACCESS_KEY ||
  process.env.AWS_SECRET_ACCESS_KEY;

const region =
  process.env.APP_AWS_REGION ||
  process.env.AWS_REGION ||
  process.env.AWS_DEFAULT_REGION ||
  'us-east-2';

const endpoint = process.env.DYNAMODB_ENDPOINT;

export const TABLE_NAME = process.env.DYNAMODB_TABLE_NAME || 'nudge_tasks';

// DynamoDB is always activated in production and development.
// In test environments without AWS, fallback prevents credential provider timeouts.
export const isDynamoConfigured =
  process.env.NODE_ENV !== 'test' ||
  Boolean(accessKeyId || process.env.DYNAMODB_ENDPOINT);

const credentials =
  accessKeyId && secretAccessKey
    ? { accessKeyId, secretAccessKey }
    : undefined;

if (process.env.NODE_ENV === 'production' && !credentials) {
  console.error(
    `[DynamoDB Init] Missing credentials in production! hasKeyId: ${Boolean(accessKeyId)}, hasSecret: ${Boolean(secretAccessKey)}, region: ${region}`,
  );
}

const baseClient = new DynamoDBClient({
  region,
  ...(credentials ? { credentials } : {}),
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
