import { Body, Controller, Get, HttpCode, Param, Post } from '@nestjs/common';
import { ZodValidationPipe } from '../common/zod-validation.pipe.js';
import { AuthService } from '../auth/auth.service.js';
import { CurrentUser } from '../auth/current-user.decorator.js';
import { Roles } from '../auth/roles.decorator.js';
import { assignRoleSchema } from '../auth/auth.schemas.js';
import type { AuthenticatedUser, PublicUser } from '../auth/auth.types.js';

@Controller('users')
export class UsersController {
  constructor(private readonly authService: AuthService) {}

  @Get('me')
  async getProfile(@CurrentUser() user: AuthenticatedUser): Promise<PublicUser> {
    return this.authService.getProfile(user.id);
  }

  @Roles('administrator')
  @HttpCode(204)
  @Post(':userId/roles')
  async assignRole(
    @Param('userId') userId: string,
    @Body(new ZodValidationPipe(assignRoleSchema)) body: unknown,
    @CurrentUser() actor: AuthenticatedUser
  ): Promise<void> {
    const { roleCode } = assignRoleSchema.parse(body);
    await this.authService.assignRole(userId, roleCode, actor.id);
  }
}
