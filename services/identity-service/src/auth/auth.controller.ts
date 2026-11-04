import { Body, Controller, HttpCode, Post, Req, Res } from '@nestjs/common';
import type { Request, Response } from 'express';
import { loadEnvironment } from '../config/environment.js';
import { ZodValidationPipe } from '../common/zod-validation.pipe.js';
import { AuthService, type AuthenticationResult, type SessionContext } from './auth.service.js';
import { loginSchema, registerSchema } from './auth.schemas.js';
import { Public } from './public.decorator.js';

@Controller('auth')
export class AuthController {
  private readonly environment = loadEnvironment();

  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register')
  async register(
    @Body(new ZodValidationPipe(registerSchema)) body: unknown,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response
  ): Promise<{ readonly accessToken: string; readonly user: AuthenticationResult['user'] }> {
    const result = await this.authService.register(
      registerSchema.parse(body),
      this.toSessionContext(request)
    );
    this.setRefreshCookie(response, result);
    return { accessToken: result.accessToken, user: result.user };
  }

  @Public()
  @HttpCode(200)
  @Post('login')
  async login(
    @Body(new ZodValidationPipe(loginSchema)) body: unknown,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response
  ): Promise<{ readonly accessToken: string; readonly user: AuthenticationResult['user'] }> {
    const result = await this.authService.login(
      loginSchema.parse(body),
      this.toSessionContext(request)
    );
    this.setRefreshCookie(response, result);
    return { accessToken: result.accessToken, user: result.user };
  }

  @Public()
  @HttpCode(200)
  @Post('refresh')
  async refresh(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response
  ): Promise<{ readonly accessToken: string; readonly user: AuthenticationResult['user'] }> {
    const result = await this.authService.refresh(request.cookies?.refresh_token);
    this.setRefreshCookie(response, result);
    return { accessToken: result.accessToken, user: result.user };
  }

  @Public()
  @HttpCode(204)
  @Post('logout')
  async logout(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response
  ): Promise<void> {
    await this.authService.logout(request.cookies?.refresh_token);
    response.clearCookie('refresh_token', { httpOnly: true, sameSite: 'strict', path: '/v1/auth' });
  }

  private setRefreshCookie(response: Response, result: AuthenticationResult): void {
    response.cookie('refresh_token', result.refreshToken, {
      httpOnly: true,
      secure: this.environment.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/v1/auth',
      expires: result.refreshExpiresAt,
    });
  }

  private toSessionContext(request: Request): SessionContext {
    return {
      userAgent: request.get('user-agent'),
      ipAddress: request.ip,
    };
  }
}
