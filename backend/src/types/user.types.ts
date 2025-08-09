export interface User {
  id: string;
  name: string;
  email: string;
  password_hash: string;
  role: 'admin' | 'manager' | 'assessor';
  created_at: Date;
}

export interface CreateUserDTO {
  name: string;
  email: string;
  password: string;
  token_code?: string;
  role: 'admin' | 'manager' | 'assessor';
}

export interface LoginDTO {
  email: string;
  password: string;
}

export interface UserResponse {
  id: string;
  name: string;
  email: string;
  role: string;
  created_at: Date;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface JWTPayload {
  id: string;
  email: string;
  role: string;
  name: string;
  organization_id: string;
}