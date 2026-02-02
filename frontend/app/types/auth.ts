export interface AuthUser {
  id: string;
  email: string;
  name?: string;
  picture?: string;
  given_name?: string;
  family_name?: string;
  sub?: string;
}

export interface AuthTokens {
  accessToken: string;
  idToken: string;
  refreshToken?: string;
}

export interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}
