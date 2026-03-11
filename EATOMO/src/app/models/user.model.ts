export interface User {
  id: string;
  username: string;
  email: string;
  fullName?: string;
  phone?: string;
  address?: string;
  role: 'admin' | 'user';
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface RegisterData {
  username: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  access_token: string;
  user: User;
}
