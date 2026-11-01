import { scryptSync, randomBytes, timingSafeEqual } from 'node:crypto';
import { PutCommand, GetCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb';
import { docClient, TABLE_NAME, isDynamoConfigured } from './dynamodb';

export interface UserAccount {
  email: string;
  name?: string;
  passwordHash: string;
  householdId: string;
  createdAt: number;
}

export interface PasswordResetToken {
  token: string;
  email: string;
  expiresAt: number;
  ttl?: number;
  createdAt: number;
}

// In-memory fallbacks for development without AWS credentials or tests
const globalAuth = globalThis as unknown as {
  __nudge_memory_tokens__?: Map<string, PasswordResetToken>;
  __nudge_memory_users__?: Map<string, UserAccount>;
};

const memoryTokens = globalAuth.__nudge_memory_tokens__ ?? new Map<string, PasswordResetToken>();
const memoryUsers = globalAuth.__nudge_memory_users__ ?? new Map<string, UserAccount>();

globalAuth.__nudge_memory_tokens__ = memoryTokens;
globalAuth.__nudge_memory_users__ = memoryUsers;

/**
 * Generates a secure salt and scrypt hash for the password.
 */
export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

/**
 * Secure constant-time verification of password against salt:hash string.
 */
export function verifyPassword(password: string, combinedHash: string): boolean {
  if (!combinedHash || !password) return false;
  const [salt, key] = combinedHash.split(':');
  if (!salt || !key) return false;
  try {
    const keyBuffer = Buffer.from(key, 'hex');
    const derivedKey = scryptSync(password, salt, 64);
    return timingSafeEqual(keyBuffer, derivedKey);
  } catch {
    return false;
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
        passwordHash: response.Item.passwordHash || '',
        householdId: response.Item.householdId,
        createdAt: response.Item.createdAt,
      };
    }
    return null;
  } catch (error) {
    console.error('[DynamoDB] Error finding user:', error);
    if (process.env.NODE_ENV === 'production') {
      throw error;
    }
    const user = memoryUsers.get(normalizedEmail);
    return user || null;
  }
}

/**
 * Registers a new user with password.
 */
export async function registerUser(
  email: string,
  password: string,
  name?: string,
): Promise<{ success: boolean; user?: UserAccount; error?: string }> {
  const normalizedEmail = email.trim().toLowerCase();
  const trimmedName = name?.trim() || undefined;

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!normalizedEmail || !emailRegex.test(normalizedEmail)) {
    return { success: false, error: 'invalid_email' };
  }

  if (!password || password.length < 6) {
    return { success: false, error: 'password_too_short' };
  }

  if (trimmedName !== undefined && trimmedName.length < 2) {
    return { success: false, error: 'invalid_name' };
  }

  const existing = await findUserByEmail(normalizedEmail);
  if (existing) {
    return { success: false, error: 'account_already_exists' };
  }

  const passwordHash = hashPassword(password);
  const now = Date.now();
  const householdId = `hh_${crypto.randomUUID()}`;

  const newUser: UserAccount = {
    email: normalizedEmail,
    ...(trimmedName ? { name: trimmedName } : {}),
    passwordHash,
    householdId,
    createdAt: now,
  };

  if (!isDynamoConfigured) {
    memoryUsers.set(normalizedEmail, newUser);
    return { success: true, user: newUser };
  }

  try {
    const command = new PutCommand({
      TableName: TABLE_NAME,
      Item: {
        PK: `USER#${normalizedEmail}`,
        SK: 'ACCOUNT',
        type: 'USER',
        email: normalizedEmail,
        ...(trimmedName ? { name: trimmedName } : {}),
        passwordHash,
        householdId,
        createdAt: now,
      },
    });

    await docClient.send(command);
    return { success: true, user: newUser };
  } catch (error) {
    console.error('[DynamoDB] Error creating user:', error);
    if (process.env.NODE_ENV === 'production') {
      throw error;
    }
    memoryUsers.set(normalizedEmail, newUser);
    return { success: true, user: newUser };
  }
}

/**
 * Authenticates user credentials with email and password.
 */
export async function authenticateUser(
  email: string,
  password: string,
): Promise<{ success: boolean; user?: UserAccount; error?: string }> {
  const normalizedEmail = email.trim().toLowerCase();

  const existing = await findUserByEmail(normalizedEmail);
  if (!existing) {
    return { success: false, error: 'account_not_found' };
  }

  if (!existing.passwordHash || !verifyPassword(password, existing.passwordHash)) {
    return { success: false, error: 'invalid_credentials' };
  }

  return { success: true, user: existing };
}

/**
 * Creates and stores a 15-minute password reset token.
 */
export async function createPasswordResetToken(email: string): Promise<string> {
  const normalizedEmail = email.trim().toLowerCase();
  const token = crypto.randomUUID();
  const now = Date.now();
  const expiresAt = now + 15 * 60 * 1000; // 15 minutes
  const ttl = Math.floor(expiresAt / 1000);

  const resetToken: PasswordResetToken = {
    token,
    email: normalizedEmail,
    expiresAt,
    ttl,
    createdAt: now,
  };

  if (!isDynamoConfigured) {
    memoryTokens.set(token, resetToken);
    return token;
  }

  try {
    const command = new PutCommand({
      TableName: TABLE_NAME,
      Item: {
        PK: `RESET_TOKEN#${token}`,
        SK: 'TOKEN',
        type: 'PASSWORD_RESET',
        token,
        email: normalizedEmail,
        expiresAt,
        ttl,
        createdAt: now,
      },
    });

    await docClient.send(command);
    return token;
  } catch (error) {
    console.error('[DynamoDB] Error saving reset token:', error);
    if (process.env.NODE_ENV === 'production') {
      throw error;
    }
    memoryTokens.set(token, resetToken);
    return token;
  }
}

/**
 * Verifies if a password reset token is valid and not expired.
 */
export async function verifyPasswordResetToken(token: string): Promise<string | null> {
  const now = Date.now();

  if (!isDynamoConfigured) {
    const item = memoryTokens.get(token);
    if (!item) return null;
    if (now > item.expiresAt) return null;
    return item.email;
  }

  try {
    const getCommand = new GetCommand({
      TableName: TABLE_NAME,
      Key: {
        PK: `RESET_TOKEN#${token}`,
        SK: 'TOKEN',
      },
    });

    const response = await docClient.send(getCommand);
    const item = response.Item as PasswordResetToken | undefined;
    if (!item) return null;
    if (now > item.expiresAt) return null;
    return item.email;
  } catch (error) {
    console.error('[DynamoDB] Error verifying reset token:', error);
    if (process.env.NODE_ENV === 'production') {
      throw error;
    }
    const item = memoryTokens.get(token);
    if (!item) return null;
    if (now > item.expiresAt) return null;
    return item.email;
  }
}

/**
 * Resets a user's password using a single-use reset token.
 */
export async function resetPasswordWithToken(
  token: string,
  newPassword: string,
): Promise<{ success: boolean; email?: string; error?: string }> {
  if (!newPassword || newPassword.length < 6) {
    return { success: false, error: 'password_too_short' };
  }

  const now = Date.now();
  let email: string | null = null;

  if (!isDynamoConfigured) {
    const item = memoryTokens.get(token);
    if (!item || now > item.expiresAt) {
      if (item) memoryTokens.delete(token);
      return { success: false, error: 'invalid_token' };
    }
    email = item.email;
    memoryTokens.delete(token);
  } else {
    try {
      const deleteCommand = new DeleteCommand({
        TableName: TABLE_NAME,
        Key: {
          PK: `RESET_TOKEN#${token}`,
          SK: 'TOKEN',
        },
        ReturnValues: 'ALL_OLD',
      });
      const response = await docClient.send(deleteCommand);
      const item = response.Attributes as PasswordResetToken | undefined;
      if (!item || now > item.expiresAt) {
        return { success: false, error: 'invalid_token' };
      }
      email = item.email;
    } catch (error) {
      console.error('[DynamoDB] Error deleting reset token:', error);
      if (process.env.NODE_ENV === 'production') {
        throw error;
      }
      const item = memoryTokens.get(token);
      if (!item || now > item.expiresAt) {
        return { success: false, error: 'invalid_token' };
      }
      email = item.email;
      memoryTokens.delete(token);
    }
  }

  if (!email) {
    return { success: false, error: 'invalid_token' };
  }

  const existing = await findUserByEmail(email);
  if (!existing) {
    return { success: false, error: 'account_not_found' };
  }

  const passwordHash = hashPassword(newPassword);
  existing.passwordHash = passwordHash;

  if (!isDynamoConfigured) {
    memoryUsers.set(email, existing);
    return { success: true, email };
  }

  try {
    const putCommand = new PutCommand({
      TableName: TABLE_NAME,
      Item: {
        PK: `USER#${email}`,
        SK: 'ACCOUNT',
        type: 'USER',
        email: existing.email,
        ...(existing.name ? { name: existing.name } : {}),
        passwordHash,
        householdId: existing.householdId,
        createdAt: existing.createdAt,
      },
    });

    await docClient.send(putCommand);
    return { success: true, email };
  } catch (error) {
    console.error('[DynamoDB] Error updating password:', error);
    if (process.env.NODE_ENV === 'production') {
      throw error;
    }
    memoryUsers.set(email, existing);
    return { success: true, email };
  }
}

/**
 * Updates a user's display name.
 */
export async function updateUserName(email: string, name: string): Promise<UserAccount | null> {
  const normalizedEmail = email.trim().toLowerCase();
  const trimmedName = name.trim();
  if (!trimmedName || trimmedName.length < 2) {
    return null;
  }

  const existing = await findUserByEmail(normalizedEmail);
  if (!existing) {
    return null;
  }

  existing.name = trimmedName;

  if (!isDynamoConfigured) {
    memoryUsers.set(normalizedEmail, existing);
    return existing;
  }

  try {
    const putCommand = new PutCommand({
      TableName: TABLE_NAME,
      Item: {
        PK: `USER#${normalizedEmail}`,
        SK: 'ACCOUNT',
        type: 'USER',
        email: normalizedEmail,
        name: trimmedName,
        passwordHash: existing.passwordHash,
        householdId: existing.householdId,
        createdAt: existing.createdAt,
      },
    });
    await docClient.send(putCommand);
    return existing;
  } catch (error) {
    console.error('[DynamoDB] Error updating user name:', error);
    if (process.env.NODE_ENV === 'production') {
      throw error;
    }
    memoryUsers.set(normalizedEmail, existing);
    return existing;
  }
}

/**
 * Deletes a user account from DynamoDB and the in-memory fallback.
 */
export async function deleteUserAccount(email: string): Promise<boolean> {
  const normalizedEmail = email.trim().toLowerCase();

  memoryUsers.delete(normalizedEmail);

  if (!isDynamoConfigured) {
    return true;
  }

  try {
    const command = new DeleteCommand({
      TableName: TABLE_NAME,
      Key: {
        PK: `USER#${normalizedEmail}`,
        SK: 'ACCOUNT',
      },
    });

    await docClient.send(command);
    return true;
  } catch (error) {
    console.error('[DynamoDB] Error deleting user account:', error);
    if (process.env.NODE_ENV === 'production') {
      throw error;
    }
    return true;
  }
}
