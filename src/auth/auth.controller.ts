import {
  Controller,
  Post,
  Body,
  Res,
  Get,
  Req,
  UseGuards,
  UseInterceptors,
  ClassSerializerInterceptor,
  SerializeOptions,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { AuthResponseDto } from './dto/auth-response.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { AuthGuard } from './auth.guard';
import type { Response, Request } from 'express';

import { JwtPayloadDto } from './dto/jwt-payload.dto';

@Controller('auth')
@UseInterceptors(ClassSerializerInterceptor)
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  @SerializeOptions({ type: AuthResponseDto })
  async register(@Body() data: RegisterDto) {
    return this.authService.register(data);
  }

  @Post('login')
  @SerializeOptions({ type: AuthResponseDto })
  async login(
    @Body() data: LoginDto,
    @Res({ passthrough: true }) response: Response,
  ): Promise<AuthResponseDto> {
    return this.authService.login(data, response);
  }

  @Post('refresh')
  @SerializeOptions({ type: AuthResponseDto })
  async refresh(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<AuthResponseDto> {
    const refreshToken = (
      request.cookies as Record<string, string | undefined>
    )['refresh_token'];
    return this.authService.handleRefresh(refreshToken, response);
  }

  @Post('logout')
  @SerializeOptions({ type: AuthResponseDto })
  async logout(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<AuthResponseDto> {
    const accessToken = (request.cookies as Record<string, string | undefined>)[
      'access_token'
    ];
    return this.authService.handleLogout(accessToken, response);
  }

  @Get('me')
  @UseGuards(AuthGuard)
  @SerializeOptions({ type: UserResponseDto })
  me(@Req() request: Request & { user: JwtPayloadDto }) {
    return new UserResponseDto({
      id: request.user.userId,
      email: request.user.email,
      name: null,
      role: request.user.role,
    });
  }
}
