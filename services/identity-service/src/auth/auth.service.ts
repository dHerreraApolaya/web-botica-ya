import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';
import { loadEnvironment } from '../config/environment.js';
import { DatabaseService } from '../database/database.service.js';
import { AuthRepository, type UserWithRoles } from './auth.repository.js';
import type { AuthenticatedUser, PublicUser } from './auth.types.js';
import type { LoginInput, RegisterInput } from './auth.schemas.js';

export interface SessionContext {
  readonly userAgent: string | undefined;
  readonly ipAddress: string | undefined;
}

export interface AuthenticationResult {
  readonly accessToken: string;
  readonly refreshToken: string;
  readonly refreshExpiresAt: Date;
  readonly user: PublicUser;
}

@Injectable()
export class AuthService {
  private readonly environment = loadEnvironment();

  constructor(
    private readonly repository: AuthRepository,
    private readonly jwtService: JwtService,
    private readonly database: DatabaseService
  ) {}

  async register(input: RegisterInput, context: SessionContext): Promise<AuthenticationResult> {
    const existingUser = await this.repository.findUserWithRolesByEmail(input.email);
    if (existingUser) throw new ConflictException({ code: 'email-exists' });

    const passwordHash = await argon2.hash(input.password, { type: argon2.argon2id });
    const userId = crypto.randomUUID();

    try {
      await this.database.transaction(async (client) => {
        await this.repository.createUser(client, {
          id: userId,
          fullName: input.fullName,
          email: input.email,
          ...(input.phone ? { phone: input.phone } : {}),
          ...(input.documentType ? { documentType: input.documentType } : {}),
          ...(input.documentNumber ? { documentNumber: input.documentNumber } : {}),
          passwordHash,
        });
        await this.repository.assignRole(client, userId, 'customer');
      });
    } catch (error: unknown) {
      if (this.isUniqueViolation(error)) throw new ConflictException({ code: 'email-exists' });
      throw error;
    }

    const user = await this.repository.findUserWithRolesById(userId);
    if (!user) throw new UnauthorizedException({ code: 'unavailable' });
    return this.createAuthenticationResult(user, context);
  }

  async login(input: LoginInput, context: SessionContext): Promise<AuthenticationResult> {
    const user = await this.repository.findUserWithRolesByEmail(input.email);
    if (!user || user.user.status !== 'active')
      throw new UnauthorizedException({
        code: user?.user.status === 'blocked' ? 'account-blocked' : 'invalid-credentials',
      });

    const validPassword = await argon2.verify(user.user.password_hash, input.password);
    if (!validPassword) throw new UnauthorizedException({ code: 'invalid-credentials' });
    return this.createAuthenticationResult(user, context);
  }

  async refresh(refreshToken: string): Promise<AuthenticationResult> {
    const [sessionId, secret] = refreshToken.split('.');
    if (!sessionId || !secret) throw new UnauthorizedException({ code: 'invalid-credentials' });
    const session = await this.repository.findSession(sessionId);
    const isValid =
      session &&
      !session.revoked_at &&
      session.expires_at > new Date() &&
      this.hashMatches(session.token_hash, this.hash(secret));
    if (!isValid || !session) throw new UnauthorizedException({ code: 'invalid-credentials' });

    const user = await this.repository.findUserWithRolesById(session.user_id);
    if (!user || user.user.status !== 'active')
      throw new UnauthorizedException({ code: 'invalid-credentials' });

    const nextSecret = randomBytes(48).toString('base64url');
    const expiresAt = this.refreshExpiry();
    await this.repository.replaceSessionToken(session.id, this.hash(nextSecret), expiresAt);
    return {
      accessToken: await this.createAccessToken(user),
      refreshToken: `${session.id}.${nextSecret}`,
      refreshExpiresAt: expiresAt,
      user: this.toPublicUser(user),
    };
  }

  async logout(refreshToken: string | undefined): Promise<void> {
    const sessionId = refreshToken?.split('.')[0];
    if (sessionId) await this.repository.revokeSession(sessionId);
  }

  async getProfile(userId: string): Promise<PublicUser> {
    const user = await this.repository.findUserWithRolesById(userId);
    if (!user) throw new UnauthorizedException({ code: 'invalid-credentials' });
    return this.toPublicUser(user);
  }

  async assignRole(userId: string, roleCode: string, assignedBy: string): Promise<void> {
    if (!(await this.repository.roleExists(roleCode)))
      throw new ConflictException({ code: 'invalid-role' });
    const user = await this.repository.findUserWithRolesById(userId);
    if (!user) throw new ConflictException({ code: 'user-not-found' });
    await this.database.transaction((client) =>
      this.repository.assignRole(client, userId, roleCode, assignedBy)
    );
  }

  async recordHealthDataConsent(userId: string, policyVersion: string): Promise<void> {
    await this.repository.recordHealthDataConsent(userId, policyVersion);
  }

  async revokeHealthDataConsent(userId: string, policyVersion: string): Promise<void> {
    await this.repository.revokeHealthDataConsent(userId, policyVersion);
  }

  private async createAuthenticationResult(
    user: UserWithRoles,
    context: SessionContext
  ): Promise<AuthenticationResult> {
    const secret = randomBytes(48).toString('base64url');
    const expiresAt = this.refreshExpiry();
    const sessionId = await this.repository.createSession(
      user.user.id,
      this.hash(secret),
      expiresAt,
      context.userAgent ? this.hash(context.userAgent) : null,
      context.ipAddress ? this.hash(context.ipAddress) : null
    );
    return {
      accessToken: await this.createAccessToken(user),
      refreshToken: `${sessionId}.${secret}`,
      refreshExpiresAt: expiresAt,
      user: this.toPublicUser(user),
    };
  }

  private async createAccessToken(user: UserWithRoles): Promise<string> {
    const payload: AuthenticatedUser = {
      id: user.user.id,
      email: user.user.email,
      roles: user.roles,
    };
    return this.jwtService.signAsync(payload, { subject: user.user.id });
  }

  private toPublicUser(user: UserWithRoles): PublicUser {
    return {
      id: user.user.id,
      fullName: user.user.full_name,
      email: user.user.email,
      phone: user.user.phone,
      documentType: user.user.document_type,
      documentNumber: user.user.document_number,
      roles: user.roles,
    };
  }

  private refreshExpiry(): Date {
    return new Date(Date.now() + this.environment.REFRESH_TOKEN_TTL_DAYS * 86_400_000);
  }

  private hash(value: string): string {
    return createHash('sha256').update(value).digest('hex');
  }

  private hashMatches(expected: string, received: string): boolean {
    return timingSafeEqual(Buffer.from(expected), Buffer.from(received));
  }

  private isUniqueViolation(error: unknown): boolean {
    return typeof error === 'object' && error !== null && 'code' in error && error.code === '23505';
  }
}
