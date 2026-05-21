import { UserResponseDto } from './user-response.dto';
export declare class AuthResponseDto {
    success: boolean;
    message?: string;
    accessToken?: string;
    user?: UserResponseDto;
    constructor(partial: Partial<AuthResponseDto>);
}
