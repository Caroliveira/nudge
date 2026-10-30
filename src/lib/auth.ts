import { PutCommand, GetCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb';
import { docClient, TABLE_NAME, isDynamoConfigured } from './dynamodb';

export interface UserAccount {
  email: string;
  householdId: string;
  createdAt: number;
}

export interface AuthToken {
  token: string;
  email: string;
  expiresAt: number;
  createdAt: number;
}

// In-memory fallbacks for development without AWS credentials or tests
const memoryTokens = new Map<string, AuthToken>();
const memoryUsers = new Map<string, UserAccount>();

/**
 * Creates and stores a 15-minute magic link token for the given email.
 */
export async function createMagicLinkToken(email: string): Promise<string> {
  const normalizedEmail = email.trim().toLowerCase();
  const token = crypto.randomUUID();
  const now = Date.now();
  const expiresAt = now + 15 * 60 * 1000; // 15 minutes

  const authToken: AuthToken = {
    token,
    email: normalizedEmail,
    expiresAt,
    createdAt: now,
  };

  if (!isDynamoConfigured) {
    memoryTokens.set(token, authToken);
    return token;
  }

  try {
    const command = new PutCommand({
      TableName: TABLE_NAME,
      Item: {
        PK: `AUTH_TOKEN#${token}`,
        SK: 'TOKEN',
        type: 'AUTH_TOKEN',
        token,
        email: normalizedEmail,
        expiresAt,
        createdAt: now,
      },
    });

    await docClient.send(command);
    return token;
  } catch (error) {
    console.warn('[DynamoDB] Error saving auth token, fallback to memory:', error);
    memoryTokens.set(token, authToken);
    return token;
  }
}

/**
 * Verifies and invalidates a magic link token.
 * Returns the email if valid and not expired, otherwise returns null.
 */
export async function verifyMagicLinkToken(token: string): Promise<string | null> {
  const now = Date.now();

  if (!isDynamoConfigured) {
    const item = memoryTokens.get(token);
    if (!item) return null;
    memoryTokens.delete(token); // Single-use token
    if (now > item.expiresAt) return null;
    return item.email;
  }

  try {
    const getCommand = new GetCommand({
      TableName: TABLE_NAME,
      Key: {
        PK: `AUTH_TOKEN#${token}`,
        SK: 'TOKEN',
      },
    });

    const response = await docClient.send(getCommand);
    const item = response.Item as AuthToken | undefined;

    if (!item) {
      return null;
    }

    // Delete single-use token immediately
    const deleteCommand = new DeleteCommand({
      TableName: TABLE_NAME,
      Key: {
        PK: `AUTH_TOKEN#${token}`,
        SK: 'TOKEN',
      },
    });
    await docClient.send(deleteCommand);

    if (now > item.expiresAt) {
      return null;
    }

    return item.email;
  } catch (error) {
    console.warn('[DynamoDB] Error verifying token, fallback to memory:', error);
    const item = memoryTokens.get(token);
    if (!item) return null;
    memoryTokens.delete(token);
    if (now > item.expiresAt) return null;
    return item.email;
  }
}

/**
 * Retrieves an existing user by email or creates a new one with a unique householdId.
 */
export async function getOrCreateUser(email: string): Promise<UserAccount> {
  const normalizedEmail = email.trim().toLowerCase();
  const now = Date.now();

  if (!isDynamoConfigured) {
    let user = memoryUsers.get(normalizedEmail);
    if (!user) {
      user = {
        email: normalizedEmail,
        householdId: `hh_${crypto.randomUUID()}`,
        createdAt: now,
      };
      memoryUsers.set(normalizedEmail, user);
    }
    return user;
  }

  try {
    const getCommand = new GetCommand({
      TableName: TABLE_NAME,
      Key: {
        PK: `USER#${normalizedEmail}`,
        SK: 'ACCOUNT',
      },
    });

    const response = await docClient.send(getCommand);
    if (response.Item) {
      return {
        email: response.Item.email,
        householdId: response.Item.householdId,
        createdAt: response.Item.createdAt,
      };
    }

    // Create new user account and associated household
    const newHouseholdId = `hh_${crypto.randomUUID()}`;
    const newUser: UserAccount = {
      email: normalizedEmail,
      householdId: newHouseholdId,
      createdAt: now,
    };

    const putCommand = new PutCommand({
      TableName: TABLE_NAME,
      Item: {
        PK: `USER#${normalizedEmail}`,
        SK: 'ACCOUNT',
        type: 'USER',
        email: normalizedEmail,
        householdId: newHouseholdId,
        createdAt: now,
      },
    });

    await docClient.send(putCommand);
    return newUser;
  } catch (error) {
    console.warn('[DynamoDB] Error finding/creating user, fallback to memory:', error);
    let user = memoryUsers.get(normalizedEmail);
    if (!user) {
      user = {
        email: normalizedEmail,
        householdId: `hh_${crypto.randomUUID()}`,
        createdAt: now,
      };
      memoryUsers.set(normalizedEmail, user);
    }
    return user;
  }
}
