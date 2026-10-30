import { PutCommand, GetCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb';
import { docClient, TABLE_NAME, isDynamoConfigured } from './dynamodb';

export interface UserAccount {
  email: string;
  name?: string;
  householdId: string;
  createdAt: number;
}

export interface AuthToken {
  token: string;
  email: string;
  name?: string;
  expiresAt: number;
  ttl?: number;
  createdAt: number;
}

export interface VerifiedTokenPayload {
  email: string;
  name?: string;
}

// In-memory fallbacks for development without AWS credentials or tests
const memoryTokens = new Map<string, AuthToken>();
const memoryUsers = new Map<string, UserAccount>();

/**
 * Creates and stores a 15-minute magic link token for the given email (and optional name for registration).
 */
export async function createMagicLinkToken(email: string, name?: string): Promise<string> {
  const normalizedEmail = email.trim().toLowerCase();
  const trimmedName = name?.trim() || undefined;
  const token = crypto.randomUUID();
  const now = Date.now();
  const expiresAt = now + 15 * 60 * 1000; // 15 minutes
  const ttl = Math.floor(expiresAt / 1000); // DynamoDB TTL attribute expects UNIX timestamp in seconds

  const authToken: AuthToken = {
    token,
    email: normalizedEmail,
    ...(trimmedName ? { name: trimmedName } : {}),
    expiresAt,
    ttl,
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
        ...(trimmedName ? { name: trimmedName } : {}),
        expiresAt,
        ttl,
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
 * Verifies and invalidates a magic link token atomically.
 * Returns the email and name if valid and not expired, otherwise returns null.
 */
export async function verifyMagicLinkToken(token: string): Promise<VerifiedTokenPayload | null> {
  const now = Date.now();

  if (!isDynamoConfigured) {
    const item = memoryTokens.get(token);
    if (!item) return null;
    memoryTokens.delete(token); // Single-use token
    if (now > item.expiresAt) return null;
    return { email: item.email, name: item.name };
  }

  try {
    // Atomic single-step delete and return: guarantees strictly single-use and prevents race conditions
    const deleteCommand = new DeleteCommand({
      TableName: TABLE_NAME,
      Key: {
        PK: `AUTH_TOKEN#${token}`,
        SK: 'TOKEN',
      },
      ReturnValues: 'ALL_OLD',
    });

    const response = await docClient.send(deleteCommand);
    const item = response.Attributes as AuthToken | undefined;

    if (!item) {
      return null;
    }

    if (now > item.expiresAt) {
      return null;
    }

    return { email: item.email, name: item.name };
  } catch (error) {
    console.warn('[DynamoDB] Error verifying token, fallback to memory:', error);
    const item = memoryTokens.get(token);
    if (!item) return null;
    memoryTokens.delete(token);
    if (now > item.expiresAt) return null;
    return { email: item.email, name: item.name };
  }
}

/**
 * Finds an existing user by email.
 */
export async function findUserByEmail(email: string): Promise<UserAccount | null> {
  const normalizedEmail = email.trim().toLowerCase();

  if (!isDynamoConfigured) {
    const user = memoryUsers.get(normalizedEmail);
    return user || null;
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
        name: response.Item.name,
        householdId: response.Item.householdId,
        createdAt: response.Item.createdAt,
      };
    }
    return null;
  } catch (error) {
    console.warn('[DynamoDB] Error finding user, fallback to memory:', error);
    const user = memoryUsers.get(normalizedEmail);
    return user || null;
  }
}

/**
 * Retrieves an existing user by email or creates a new one with a unique householdId.
 * If a name is provided and the user does not have a name yet, updates it.
 */
export async function getOrCreateUser(email: string, name?: string): Promise<UserAccount> {
  const normalizedEmail = email.trim().toLowerCase();
  const trimmedName = name?.trim() || undefined;
  const now = Date.now();

  const existing = await findUserByEmail(normalizedEmail);
  if (existing) {
    if (trimmedName && !existing.name) {
      existing.name = trimmedName;
      if (!isDynamoConfigured) {
        memoryUsers.set(normalizedEmail, existing);
      } else {
        try {
          const putCommand = new PutCommand({
            TableName: TABLE_NAME,
            Item: {
              PK: `USER#${normalizedEmail}`,
              SK: 'ACCOUNT',
              type: 'USER',
              email: normalizedEmail,
              name: trimmedName,
              householdId: existing.householdId,
              createdAt: existing.createdAt,
            },
          });
          await docClient.send(putCommand);
        } catch (error) {
          console.warn('[DynamoDB] Error updating user name:', error);
        }
      }
    }
    return existing;
  }

  // Create new user account and associated household
  const newHouseholdId = `hh_${crypto.randomUUID()}`;
  const newUser: UserAccount = {
    email: normalizedEmail,
    ...(trimmedName ? { name: trimmedName } : {}),
    householdId: newHouseholdId,
    createdAt: now,
  };

  if (!isDynamoConfigured) {
    memoryUsers.set(normalizedEmail, newUser);
    return newUser;
  }

  try {
    const putCommand = new PutCommand({
      TableName: TABLE_NAME,
      Item: {
        PK: `USER#${normalizedEmail}`,
        SK: 'ACCOUNT',
        type: 'USER',
        email: normalizedEmail,
        ...(trimmedName ? { name: trimmedName } : {}),
        householdId: newHouseholdId,
        createdAt: now,
      },
    });

    await docClient.send(putCommand);
    return newUser;
  } catch (error) {
    console.warn('[DynamoDB] Error creating user, fallback to memory:', error);
    memoryUsers.set(normalizedEmail, newUser);
    return newUser;
  }
}
