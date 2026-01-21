type User = {
  id: string;
  username: string;
  email: string;
};

type LoginResponse = {
  token: string;
  user: User;
};

const API = '/api';

class AuthService {
  private static TOKEN_KEY = "auth_token";
  private static USER_KEY = "auth_user";

  static getToken() {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  static getUser(): User | null {
    const raw = localStorage.getItem(this.USER_KEY);
    return raw ? JSON.parse(raw) : null;
  }

  static isLoggedIn() {
    return Boolean(this.getToken());
  }

  static async login(email: string, password: string): Promise<User> {
    const res = await fetch(`${API}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Login failed");
    }

    const data: LoginResponse = await res.json();

    localStorage.setItem(this.TOKEN_KEY, data.token);
    localStorage.setItem(this.USER_KEY, JSON.stringify(data.user));

    return data.user;
  }

  static async register(
    username: string,
    email: string,
    password: string,
    confirmPassword: string
  ) {
    const res = await fetch(`${API}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username,
        email,
        password,
        confirmPassword
      })
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Register failed");
    }
  }

  static logout() {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
  }
}

export default AuthService;
