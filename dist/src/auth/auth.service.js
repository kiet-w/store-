"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const user_service_1 = require("../user/user.service");
const bcrypt = __importStar(require("bcryptjs"));
const jwt = __importStar(require("jsonwebtoken"));
const auth_response_dto_1 = require("./dto/auth-response.dto");
const user_response_dto_1 = require("./dto/user-response.dto");
let AuthService = class AuthService {
    userService;
    configService;
    JWT_ACCESS_SECRET;
    JWT_REFRESH_SECRET;
    constructor(userService, configService) {
        this.userService = userService;
        this.configService = configService;
        const accessSecret = this.configService.get('JWT_ACCESS_SECRET');
        const refreshSecret = this.configService.get('JWT_REFRESH_SECRET');
        if (!accessSecret || !refreshSecret) {
            throw new common_1.InternalServerErrorException('JWT secrets are not defined in environment variables');
        }
        this.JWT_ACCESS_SECRET = accessSecret;
        this.JWT_REFRESH_SECRET = refreshSecret;
    }
    async register(data) {
        const existingUser = await this.userService.findByEmail(data.email);
        if (existingUser) {
            throw new common_1.ConflictException('Email đã được sử dụng');
        }
        const hashedPassword = await bcrypt.hash(data.password, 10);
        await this.userService.create({
            email: data.email,
            name: data.name,
            password: hashedPassword,
        });
        return new auth_response_dto_1.AuthResponseDto({
            success: true,
            message: 'Đăng ký thành công!',
        });
    }
    async login(data, response) {
        const user = await this.userService.findByEmail(data.email);
        if (!user || !(await bcrypt.compare(data.password, user.password))) {
            throw new common_1.UnauthorizedException('Email hoặc mật khẩu không đúng');
        }
        const tokens = this.generateTokens(user.id, user.email, user.role);
        await this.updateRefreshToken(user.id, tokens.refreshToken);
        this.setCookies(response, tokens);
        return new auth_response_dto_1.AuthResponseDto({
            success: true,
            accessToken: tokens.accessToken,
            user: new user_response_dto_1.UserResponseDto({
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
            }),
        });
    }
    async handleRefresh(refreshToken, response) {
        if (!refreshToken) {
            throw new common_1.UnauthorizedException('Không tìm thấy Refresh Token');
        }
        let payload;
        try {
            payload = jwt.verify(refreshToken, this.JWT_REFRESH_SECRET);
        }
        catch (err) {
            if (err instanceof jwt.TokenExpiredError) {
                throw new common_1.UnauthorizedException('Refresh Token đã hết hạn');
            }
            throw new common_1.UnauthorizedException('Refresh Token không hợp lệ');
        }
        const user = await this.userService.findById(payload.userId);
        if (!user ||
            !user.refreshToken ||
            !(await bcrypt.compare(refreshToken, user.refreshToken))) {
            throw new common_1.UnauthorizedException('Refresh Token không hợp lệ');
        }
        const tokens = this.generateTokens(user.id, user.email, user.role);
        await this.updateRefreshToken(user.id, tokens.refreshToken);
        this.setCookies(response, tokens);
        return new auth_response_dto_1.AuthResponseDto({ success: true });
    }
    async handleLogout(accessToken, response) {
        if (accessToken) {
            const payload = this.validateAccessToken(accessToken);
            if (payload) {
                await this.logout(payload.userId);
            }
        }
        const isProduction = this.configService.get('NODE_ENV') === 'production';
        const cookieOptions = {
            httpOnly: true,
            secure: isProduction,
            sameSite: 'lax',
        };
        response.clearCookie('access_token', cookieOptions);
        response.clearCookie('refresh_token', cookieOptions);
        return new auth_response_dto_1.AuthResponseDto({ success: true });
    }
    async logout(userId) {
        await this.userService.update(userId, { refreshToken: null });
    }
    setCookies(response, tokens) {
        const isProduction = this.configService.get('NODE_ENV') === 'production';
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
    generateTokens(userId, email, role) {
        const accessToken = jwt.sign({ userId, email, role }, this.JWT_ACCESS_SECRET, {
            expiresIn: '15m',
        });
        const refreshToken = jwt.sign({ userId, email, role }, this.JWT_REFRESH_SECRET, {
            expiresIn: '7d',
        });
        return { accessToken, refreshToken };
    }
    async updateRefreshToken(userId, refreshToken) {
        const hashed = await bcrypt.hash(refreshToken, 10);
        await this.userService.update(userId, { refreshToken: hashed });
    }
    validateAccessToken(token) {
        try {
            return jwt.verify(token, this.JWT_ACCESS_SECRET);
        }
        catch {
            return null;
        }
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [user_service_1.UserService,
        config_1.ConfigService])
], AuthService);
//# sourceMappingURL=auth.service.js.map