import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UserService } from '../user/user.service';
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { TokenDto } from './dto/token.dto';
import { AuthResponseDto } from './dto/auth-response.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { JwtPayloadDto } from './dto/jwt-payload.dto';
import type { Response } from 'express';
import { UserRole } from '@prisma/client';

@Injectable()
export class AuthService {
  private readonly JWT_ACCESS_SECRET: string;
  private readonly JWT_REFRESH_SECRET: string;

  constructor(
    private userService: UserService,
    private configService: ConfigService,
  ) {
    const accessSecret = this.configService.get<string>('JWT_ACCESS_SECRET');
    const refreshSecret = this.configService.get<string>('JWT_REFRESH_SECRET');

    if (!accessSecret || !refreshSecret) {
      throw new InternalServerErrorException(
        'JWT secrets are not defined in environment variables',
      );
    }
    this.JWT_ACCESS_SECRET = accessSecret;
    this.JWT_REFRESH_SECRET = refreshSecret;
  }

  async register(data: RegisterDto): Promise<AuthResponseDto> {
    const existingUser = await this.userService.findByEmail(data.email);

    if (existingUser) {
      throw new ConflictException('Email đã được sử dụng');
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);

    await this.userService.create({
      email: data.email,
      name: data.name,
      password: hashedPassword,
    });

    return new AuthResponseDto({
      success: true,
      message: 'Đăng ký thành công!',
    });
  }

  async login(data: LoginDto, response: Response): Promise<AuthResponseDto> {
    const user = await this.userService.findByEmail(data.email);

    // ✅ Fix: thêm đóng ngoặc } sau throw — đây là bug chính
    if (!user || !(await bcrypt.compare(data.password, user.password))) {
      throw new UnauthorizedException('Email hoặc mật khẩu không đúng');
    }

    // Phần này phải nằm NGOÀI if, không phải trong
    const tokens = this.generateTokens(user.id, user.email, user.role);
    await this.updateRefreshToken(user.id, tokens.refreshToken);
    this.setCookies(response, tokens);

    return new AuthResponseDto({
      success: true,
      accessToken: tokens.accessToken,
      user: new UserResponseDto({
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      }),
    });
  }

  async handleRefresh(
    refreshToken: string | undefined,
    response: Response,
  ): Promise<AuthResponseDto> {
    if (!refreshToken) {
      throw new UnauthorizedException('Không tìm thấy Refresh Token');
    }
    let payload: JwtPayloadDto;
    try {
      payload = jwt.verify(
        refreshToken,
        this.JWT_REFRESH_SECRET,
      ) as JwtPayloadDto;
    } catch (err) {
      if (err instanceof jwt.TokenExpiredError) {
        throw new UnauthorizedException('Refresh Token đã hết hạn');
      }
      throw new UnauthorizedException('Refresh Token không hợp lệ');
    }

    const user = await this.userService.findById(payload.userId);

    // ✅ Fix: dùng bcrypt.compare thay vì !== vì token đã được hash
    if (
      !user ||
      !user.refreshToken ||
      !(await bcrypt.compare(refreshToken, user.refreshToken))
    ) {
      throw new UnauthorizedException('Refresh Token không hợp lệ');
    }

    const tokens = this.generateTokens(user.id, user.email, user.role);
    await this.updateRefreshToken(user.id, tokens.refreshToken);
    this.setCookies(response, tokens);

    return new AuthResponseDto({ success: true });
  }

  async handleLogout(
    accessToken: string | undefined,
    response: Response,
  ): Promise<AuthResponseDto> {
    if (accessToken) {
      const payload = this.validateAccessToken(
        accessToken,
      ) as JwtPayloadDto | null;
      if (payload) {
        await this.logout(payload.userId);
      }
    }

    const isProduction =
      this.configService.get<string>('NODE_ENV') === 'production';
    const cookieOptions = {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax' as const,
    };

    response.clearCookie('access_token', cookieOptions);
    response.clearCookie('refresh_token', cookieOptions);

    return new AuthResponseDto({ success: true });
  }

  async logout(userId: number): Promise<void> {
    await this.userService.update(userId, { refreshToken: null });
  }
  private setCookies(response: Response, tokens: TokenDto): void {
    const isProduction =
      this.configService.get<string>('NODE_ENV') === 'production';

    response.cookie('access_token', tokens.accessToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      maxAge: 15 * 60 * 1000,
    });

    response.cookie('refresh_token', tokens.refreshToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
  }

  private generateTokens(
    userId: number,
    email: string,
    role: UserRole,
  ): TokenDto {
    const accessToken = jwt.sign(
      { userId, email, role },
      this.JWT_ACCESS_SECRET,
      {
        expiresIn: '15m',
      },
    );

    const refreshToken = jwt.sign(
      { userId, email, role },
      this.JWT_REFRESH_SECRET,
      {
        expiresIn: '7d',
      },
    );

    return { accessToken, refreshToken };
  }

  private async updateRefreshToken(
    userId: number,
    refreshToken: string,
  ): Promise<void> {
    // ✅ Fix: hash refresh token trước khi lưu DB
    const hashed = await bcrypt.hash(refreshToken, 10);
    await this.userService.update(userId, { refreshToken: hashed });
  }

  validateAccessToken(token: string): string | jwt.JwtPayload | null {
    try {
      return jwt.verify(token, this.JWT_ACCESS_SECRET);
    } catch {
      return null;
    }
  }
}
