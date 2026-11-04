import { Body, Controller, Delete, HttpCode, Post } from '@nestjs/common';
import { ZodValidationPipe } from '../common/zod-validation.pipe.js';
import { AuthService } from '../auth/auth.service.js';
import { CurrentUser } from '../auth/current-user.decorator.js';
import { healthDataConsentSchema } from '../auth/auth.schemas.js';
import type { AuthenticatedUser } from '../auth/auth.types.js';

@Controller('consents/health-data')
export class ConsentsController {
  constructor(private readonly authService: AuthService) {}

  @HttpCode(204)
  @Post()
  async accept(
    @Body(new ZodValidationPipe(healthDataConsentSchema)) body: unknown,
    @CurrentUser() user: AuthenticatedUser
  ): Promise<void> {
    const { policyVersion } = healthDataConsentSchema.parse(body);
    await this.authService.recordHealthDataConsent(user.id, policyVersion);
  }

  @HttpCode(204)
  @Delete()
  async revoke(
    @Body(new ZodValidationPipe(healthDataConsentSchema)) body: unknown,
    @CurrentUser() user: AuthenticatedUser
  ): Promise<void> {
    const { policyVersion } = healthDataConsentSchema.parse(body);
    await this.authService.revokeHealthDataConsent(user.id, policyVersion);
  }
}
