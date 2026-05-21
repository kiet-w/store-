import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { AuthResponseDto } from './dto/auth-response.dto';
import { UserResponseDto } from './dto/user-response.dto';
import type { Response, Request } from 'express';
import { JwtPayloadDto } from './dto/jwt-payload.dto';
export declare class AuthController {
    private authService;
    constructor(authService: AuthService);
    register(data: RegisterDto): Promise<AuthResponseDto>;
    login(data: LoginDto, response: Response): Promise<AuthResponseDto>;
    refresh(request: Request, response: Response): Promise<AuthResponseDto>;
    logout(request: Request, response: Response): Promise<AuthResponseDto>;
    me(request: Request & {
        user: JwtPayloadDto;
    }): UserResponseDto;
}
