import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

import { TokenService } from '../token.service.js';

export interface AuthenticatedUser {
  userId: string;
  organizationId: string;
}

@Injectable()
export class JwtAccessStrategy extends PassportStrategy(
  Strategy,
  'jwt-access',
) {
  constructor(
    configService: ConfigService,
    private readonly tokenService: TokenService,
  ) {
    super({
      jwtFromRequest:
        ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey:
        configService.getOrThrow<string>(
          'JWT_ACCESS_SECRET',
        ),
    });
  }

  async validate(payload: unknown): Promise<AuthenticatedUser> {
    if (
      typeof payload !== 'object' ||
      payload === null
    ) {
      throw new UnauthorizedException(
        'Invalid access token',
      );
    }

    const tokenPayload =
      payload as Record<string, unknown>;

    if (
      tokenPayload.type !== 'access' ||
      typeof tokenPayload.sub !== 'string' ||
      typeof tokenPayload.organizationId !== 'string'
    ) {
      throw new UnauthorizedException(
        'Invalid access token',
      );
    }

    return {
      userId: tokenPayload.sub,
      organizationId:
        tokenPayload.organizationId,
    };
  }
}