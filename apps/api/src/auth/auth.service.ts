import { createHash } from 'node:crypto';

import { ConfigService } from '@nestjs/config';
import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import {
  ClientSession,
  HydratedDocument,
  Model,
  Types,
} from 'mongoose';

import { Organization } from '../organizations/schemas/organization.schema.js';
import { User } from '../users/schemas/user.schema.js';
import { LoginDto } from './dto/login.dto.js';
import { RefreshTokenDto } from './dto/refresh-token.dto.js';
import { RegisterDto } from './dto/register.dto.js';
import { PasswordService } from './password.service.js';
import { RefreshSession } from './schemas/refresh-session.schema.js';
import { TokenService } from './token.service.js';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(Organization.name)
    private readonly organizationModel: Model<Organization>,

    @InjectModel(User.name)
    private readonly userModel: Model<User>,

    @InjectModel(RefreshSession.name)
    private readonly refreshSessionModel: Model<RefreshSession>,

    private readonly passwordService: PasswordService,
    private readonly tokenService: TokenService,
    private readonly configService: ConfigService,
  ) {}

  async register(dto: RegisterDto) {
    const email = dto.email.trim().toLowerCase();
    const slug = dto.organizationSlug.trim().toLowerCase();

    const existingOrganization =
      await this.organizationModel.findOne({ slug }).lean();

    if (existingOrganization) {
      throw new ConflictException(
        'Organization slug is already in use',
      );
    }

    const existingUser = await this.userModel.findOne({
      email,
    });

    if (existingUser) {
      throw new ConflictException(
        'An account with this email already exists',
      );
    }

    const passwordHash =
      await this.passwordService.hash(dto.password);

    const session: ClientSession =
      await this.organizationModel.db.startSession();

    try {
      let user!: HydratedDocument<User>;
      let organization!: HydratedDocument<Organization>;

      await session.withTransaction(async () => {
        const organizations =
          await this.organizationModel.create(
            [
              {
                name: dto.organizationName.trim(),
                slug,
                status: 'ACTIVE',
              },
            ],
            { session },
          );

        organization = organizations[0];

        const users = await this.userModel.create(
          [
            {
              organizationId: organization._id,
              email,
              passwordHash,
              firstName: dto.firstName.trim(),
              lastName: dto.lastName.trim(),
              status: 'ACTIVE',
              emailVerified: false,
            },
          ],
          { session },
        );

        user = users[0];
      });

      const tokens = await this.issueTokens(
        user._id,
        organization._id,
      );

      return {
        user: this.sanitizeUser(user),
        ...tokens,
      };
    } finally {
      await session.endSession();
    }
  }

  async login(dto: LoginDto) {
    const email = dto.email.trim().toLowerCase();

    const user = await this.userModel
      .findOne({ email })
      .select('+passwordHash');

    if (!user) {
      throw new UnauthorizedException(
        'Invalid email or password',
      );
    }

    if (
      user.status !== 'ACTIVE' &&
      user.status !== 'INVITED'
    ) {
      throw new UnauthorizedException(
        'This account is not available for login',
      );
    }

    const passwordValid =
      await this.passwordService.verify(
        user.passwordHash,
        dto.password,
      );

    if (!passwordValid) {
      throw new UnauthorizedException(
        'Invalid email or password',
      );
    }

    user.lastLoginAt = new Date();
    await user.save();

    const tokens = await this.issueTokens(
      user._id,
      user.organizationId,
    );

    return {
      user: this.sanitizeUser(user),
      ...tokens,
    };
  }

  async refresh(dto: RefreshTokenDto) {
    let payload;

    try {
      payload =
        await this.tokenService.verifyRefreshToken(
          dto.refreshToken,
        );
    } catch {
      throw new UnauthorizedException(
        'Invalid or expired refresh token',
      );
    }

    if (
      payload.type !== 'refresh' ||
      !payload.sub ||
      !payload.organizationId ||
      !payload.sessionId
    ) {
      throw new UnauthorizedException(
        'Invalid refresh token',
      );
    }

    if (!Types.ObjectId.isValid(payload.sub)) {
      throw new UnauthorizedException(
        'Invalid refresh token',
      );
    }

    if (
      !Types.ObjectId.isValid(
        payload.organizationId,
      )
    ) {
      throw new UnauthorizedException(
        'Invalid refresh token',
      );
    }

    if (
      !Types.ObjectId.isValid(
        payload.sessionId,
      )
    ) {
      throw new UnauthorizedException(
        'Invalid refresh token',
      );
    }

    const tokenHash = createHash('sha256')
      .update(dto.refreshToken)
      .digest('hex');

    const now = new Date();

    const currentSession =
      await this.refreshSessionModel
        .findOne({
          _id: new Types.ObjectId(payload.sessionId),
          userId: new Types.ObjectId(payload.sub),
          organizationId: new Types.ObjectId(
            payload.organizationId,
          ),
          revokedAt: { $exists: false },
          expiresAt: { $gt: now },
        })
        .select('+tokenHash');

    if (!currentSession) {
      throw new UnauthorizedException(
        'Refresh session is invalid or revoked',
      );
    }

    if (currentSession.tokenHash !== tokenHash) {
      throw new UnauthorizedException(
        'Invalid refresh token',
      );
    }

    const revokedSession =
      await this.refreshSessionModel.findOneAndUpdate(
        {
          _id: currentSession._id,
          revokedAt: { $exists: false },
          expiresAt: { $gt: now },
        },
        {
          $set: {
            revokedAt: now,
            lastUsedAt: now,
          },
        },
        {
          new: true,
        },
      );

    if (!revokedSession) {
      throw new UnauthorizedException(
        'Refresh token has already been used',
      );
    }

    const user = await this.userModel.findById(
      payload.sub,
    );

    if (!user) {
      throw new UnauthorizedException(
        'User account no longer exists',
      );
    }

    if (
      user.status !== 'ACTIVE' &&
      user.status !== 'INVITED'
    ) {
      throw new UnauthorizedException(
        'This account is not available for login',
      );
    }

    const tokens = await this.issueTokens(
      user._id,
      user.organizationId,
    );

    return {
      user: this.sanitizeUser(user),
      ...tokens,
    };
  }

  async logout(dto: RefreshTokenDto) {
    let payload;

    try {
      payload =
        await this.tokenService.verifyRefreshToken(
          dto.refreshToken,
        );
    } catch {
      throw new UnauthorizedException(
        'Invalid or expired refresh token',
      );
    }

    if (
      payload.type !== 'refresh' ||
      !payload.sessionId
    ) {
      throw new UnauthorizedException(
        'Invalid refresh token',
      );
    }

    if (
      !Types.ObjectId.isValid(
        payload.sessionId,
      )
    ) {
      throw new UnauthorizedException(
        'Invalid refresh token',
      );
    }

    const tokenHash = createHash('sha256')
      .update(dto.refreshToken)
      .digest('hex');

    const revokedAt = new Date();

    const session =
      await this.refreshSessionModel.findOneAndUpdate(
        {
          _id: new Types.ObjectId(
            payload.sessionId,
          ),
          tokenHash,
          revokedAt: { $exists: false },
        },
        {
          $set: {
            revokedAt,
            lastUsedAt: revokedAt,
          },
        },
        {
          new: true,
        },
      );

    if (!session) {
      throw new UnauthorizedException(
        'Refresh session is invalid or already revoked',
      );
    }

    return {
      message: 'Logged out successfully',
    };
  }

  private async issueTokens(
    userId: Types.ObjectId,
    organizationId: Types.ObjectId,
  ) {
    const sessionId = new Types.ObjectId();

    const accessToken =
      await this.tokenService.createAccessToken({
        sub: userId.toString(),
        organizationId: organizationId.toString(),
      });

    const refreshToken =
      await this.tokenService.createRefreshToken({
        sub: userId.toString(),
        organizationId: organizationId.toString(),
        sessionId: sessionId.toString(),
      });

    const tokenHash = createHash('sha256')
      .update(refreshToken)
      .digest('hex');

    const refreshExpiresIn =
      this.configService.getOrThrow<string>(
        'JWT_REFRESH_EXPIRES_IN',
      );

    const expiresAt = this.calculateExpiry(
      refreshExpiresIn,
    );

    await this.refreshSessionModel.create({
      _id: sessionId,
      userId,
      organizationId,
      tokenHash,
      expiresAt,
    });

    return {
      accessToken,
      refreshToken,
    };
  }

  private calculateExpiry(expiresIn: string): Date {
    const match = expiresIn.match(
      /^(\d+)([smhd])$/,
    );

    if (!match) {
      throw new Error(
        'Invalid JWT_REFRESH_EXPIRES_IN configuration',
      );
    }

    const amount = Number(match[1]);
    const unit = match[2];

    const multipliers: Record<string, number> = {
      s: 1_000,
      m: 60_000,
      h: 3_600_000,
      d: 86_400_000,
    };

    const milliseconds =
      amount * multipliers[unit];

    return new Date(Date.now() + milliseconds);
  }

  private sanitizeUser(
    user: HydratedDocument<User>,
  ) {
    return {
      id: user._id.toString(),
      organizationId: user.organizationId.toString(),
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      status: user.status,
      emailVerified: user.emailVerified,
      roleId: user.roleId?.toString(),
      lastLoginAt: user.lastLoginAt,
    };
  }
}