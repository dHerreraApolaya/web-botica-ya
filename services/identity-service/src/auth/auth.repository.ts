import { Injectable } from '@nestjs/common';
import type { QueryResultRow } from 'pg';
import type { DatabaseClient } from '../database/database.service.js';
import { DatabaseService } from '../database/database.service.js';

interface UserRow extends QueryResultRow {
  readonly id: string;
  readonly full_name: string;
  readonly email: string;
  readonly phone: string | null;
  readonly document_type: string | null;
  readonly document_number: string | null;
  readonly password_hash: string;
  readonly status: 'active' | 'blocked' | 'deleted';
}

interface RoleRow extends QueryResultRow {
  readonly code: string;
}

interface SessionRow extends QueryResultRow {
  readonly id: string;
  readonly user_id: string;
  readonly token_hash: string;
  readonly expires_at: Date;
  readonly revoked_at: Date | null;
}

export interface UserWithRoles {
  readonly user: UserRow;
  readonly roles: readonly string[];
}

@Injectable()
export class AuthRepository {
  constructor(private readonly database: DatabaseService) {}

  async findUserWithRolesByEmail(email: string): Promise<UserWithRoles | null> {
    const rows = await this.database.query<UserRow>(
      `SELECT id, full_name, email, phone, document_type, document_number, password_hash, status
       FROM users
       WHERE email = $1 AND deleted_at IS NULL`,
      [email]
    );
    const user = rows[0];
    if (!user) return null;
    return { user, roles: await this.findRoleCodes(user.id) };
  }

  async findUserWithRolesById(id: string): Promise<UserWithRoles | null> {
    const rows = await this.database.query<UserRow>(
      `SELECT id, full_name, email, phone, document_type, document_number, password_hash, status
       FROM users
       WHERE id = $1 AND deleted_at IS NULL`,
      [id]
    );
    const user = rows[0];
    if (!user) return null;
    return { user, roles: await this.findRoleCodes(user.id) };
  }

  async createUser(
    client: DatabaseClient,
    user: {
      readonly id: string;
      readonly fullName: string;
      readonly email: string;
      readonly phone?: string;
      readonly documentType?: string;
      readonly documentNumber?: string;
      readonly passwordHash: string;
    }
  ): Promise<void> {
    await client.query(
      `INSERT INTO users
       (id, full_name, email, phone, document_type, document_number, password_hash)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        user.id,
        user.fullName,
        user.email,
        user.phone ?? null,
        user.documentType ?? null,
        user.documentNumber ?? null,
        user.passwordHash,
      ]
    );
  }

  async assignRole(
    client: DatabaseClient,
    userId: string,
    roleCode: string,
    assignedBy?: string
  ): Promise<void> {
    await client.query(
      `INSERT INTO user_roles (user_id, role_id, assigned_by)
       SELECT $1, id, $3 FROM roles WHERE code = $2 AND active = TRUE
       ON CONFLICT (user_id, role_id) DO NOTHING`,
      [userId, roleCode, assignedBy ?? null]
    );
  }

  async roleExists(roleCode: string): Promise<boolean> {
    const rows = await this.database.query<RoleRow>(
      'SELECT code FROM roles WHERE code = $1 AND active = TRUE',
      [roleCode]
    );
    return Boolean(rows[0]);
  }

  async createSession(
    userId: string,
    tokenHash: string,
    expiresAt: Date,
    userAgentHash: string | null,
    ipHash: string | null
  ): Promise<string> {
    const id = crypto.randomUUID();
    await this.database.query(
      `INSERT INTO sessions (id, user_id, token_hash, expires_at, user_agent_hash, ip_hash)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [id, userId, tokenHash, expiresAt, userAgentHash, ipHash]
    );
    return id;
  }

  async findSession(id: string): Promise<SessionRow | null> {
    const rows = await this.database.query<SessionRow>(
      'SELECT id, user_id, token_hash, expires_at, revoked_at FROM sessions WHERE id = $1',
      [id]
    );
    return rows[0] ?? null;
  }

  async replaceSessionToken(id: string, tokenHash: string, expiresAt: Date): Promise<void> {
    await this.database.query(
      'UPDATE sessions SET token_hash = $2, expires_at = $3 WHERE id = $1 AND revoked_at IS NULL',
      [id, tokenHash, expiresAt]
    );
  }

  async revokeSession(id: string): Promise<void> {
    await this.database.query(
      'UPDATE sessions SET revoked_at = NOW() WHERE id = $1 AND revoked_at IS NULL',
      [id]
    );
  }

  async recordHealthDataConsent(userId: string, policyVersion: string): Promise<void> {
    await this.database.query(
      `INSERT INTO consents (id, user_id, type, policy_version)
       VALUES ($1, $2, 'health_data_processing', $3)
       ON CONFLICT (user_id, type, policy_version)
       DO UPDATE SET accepted_at = NOW(), revoked_at = NULL`,
      [crypto.randomUUID(), userId, policyVersion]
    );
  }

  async revokeHealthDataConsent(userId: string, policyVersion: string): Promise<void> {
    await this.database.query(
      `UPDATE consents
       SET revoked_at = NOW()
       WHERE user_id = $1 AND type = 'health_data_processing' AND policy_version = $2 AND revoked_at IS NULL`,
      [userId, policyVersion]
    );
  }

  private async findRoleCodes(userId: string): Promise<readonly string[]> {
    const rows = await this.database.query<RoleRow>(
      `SELECT roles.code
       FROM roles
       INNER JOIN user_roles ON user_roles.role_id = roles.id
       WHERE user_roles.user_id = $1 AND roles.active = TRUE
       ORDER BY roles.code`,
      [userId]
    );
    return rows.map((row) => row.code);
  }
}
