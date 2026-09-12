import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import type { SignOptions } from 'jsonwebtoken';

export interface AccessTokenPayload {
  sub: string;
  organizationId: string;
  type: 'access';
}

export interface RefreshTokenPayload {
  sub: string;
  organizationId: string;
  sessionId: string;
  type: 'refresh';
}

@Injectable()
export class TokenService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async createAccessToken(
    payload: Omit<AccessTokenPayload, 'type'>,
  ): Promise<string> {
    const secret =
      this.configService.getOrThrow<string>('JWT_ACCESS_SECRET');

    const expiresIn =
      this.configService.getOrThrow<string>(
        'JWT_ACCESS_EXPIRES_IN',
      ) as SignOptions['expiresIn'];

    return this.jwtService.signAsync(
      {
        ...payload,
        type: 'access',
      },
      {
        secret,
        expiresIn,
      },
    );
  }

  async createRefreshToken(
    payload: Omit<RefreshTokenPayload, 'type'>,
  ): Promise<string> {
    const secret =
      this.configService.getOrThrow<string>('JWT_REFRESH_SECRET');

    const expiresIn =
      this.configService.getOrThrow<string>(
        'JWT_REFRESH_EXPIRES_IN',
      ) as SignOptions['expiresIn'];

    return this.jwtService.signAsync(
      {
        ...payload,
        type: 'refresh',
      },
      {
        secret,
        expiresIn,
      },
    );
  }

  async verifyAccessToken(
    token: string,
  ): Promise<AccessTokenPayload> {
    const secret =
      this.configService.getOrThrow<string>('JWT_ACCESS_SECRET');

    return this.jwtService.verifyAsync<AccessTokenPayload>(token, {
      secret,
    });
  }

  async verifyRefreshToken(
    token: string,
  ): Promise<RefreshTokenPayload> {
    const secret =
      this.configService.getOrThrow<string>('JWT_REFRESH_SECRET');

    return this.jwtService.verifyAsync<RefreshTokenPayload>(token, {
      secret,
    });
  }
}