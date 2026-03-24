import { UserRole } from '../enums';

export interface AuthContext {
  userId: string;
  email: string;
  role: UserRole;
  iat: number;
  exp: number;
}

export interface JwtPayload {
  userId: string;
  email: string;
  role: UserRole;
}

export interface LoginDTO {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    role: UserRole;
  };
}
