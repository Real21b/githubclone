import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { logger } from '../utils/logger';

interface User {
  id: string;
  username: string;
  email: string;
  password: string;
  bio?: string;
  createdAt: Date;
}

interface RegisterData {
  username: string;
  email: string;
  password: string;
  bio?: string;
}

interface LoginResult {
  user: Omit<User, 'password'>;
  accessToken: string;
  refreshToken: string;
}

export class AuthService {
  private jwtSecret: string;
  private jwtExpiry: string;
  private refreshSecret: string;
  private refreshExpiry: string;

  constructor() {
    this.jwtSecret = process.env.JWT_SECRET || 'fallback-secret';
    this.jwtExpiry = process.env.JWT_EXPIRY || '15m';
    this.refreshSecret = process.env.REFRESH_SECRET || 'fallback-refresh-secret';
    this.refreshExpiry = process.env.REFRESH_EXPIRY || '7d';
  }

  async register(data: RegisterData): Promise<LoginResult> {
    try {
      // Check if user already exists
      const existingUser = await this.findUserByEmail(data.email);
      if (existingUser) {
        throw new Error('User already exists with this email');
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(data.password, 12);

      // Create user (in real app, save to database)
      const user: User = {
        id: this.generateId(),
        username: data.username,
        email: data.email,
        password: hashedPassword,
        bio: data.bio,
        createdAt: new Date()
      };

      // Generate tokens
      const accessToken = this.generateAccessToken(user);
      const refreshToken = this.generateRefreshToken(user);

      logger.info('User registered successfully', { userId: user.id, email: user.email });

      return {
        user: this.sanitizeUser(user),
        accessToken,
        refreshToken
      };
    } catch (error) {
      logger.error('Registration failed', { error: error.message, email: data.email });
      throw error;
    }
  }

  async login(email: string, password: string): Promise<LoginResult> {
    try {
      // Find user
      const user = await this.findUserByEmail(email);
      if (!user) {
        throw new Error('Invalid credentials');
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        throw new Error('Invalid credentials');
      }

      // Generate tokens
      const accessToken = this.generateAccessToken(user);
      const refreshToken = this.generateRefreshToken(user);

      logger.info('User logged in successfully', { userId: user.id, email: user.email });

      return {
        user: this.sanitizeUser(user),
        accessToken,
        refreshToken
      };
    } catch (error) {
      logger.error('Login failed', { error: error.message, email });
      throw error;
    }
  }

  async refreshToken(refreshToken: string): Promise<{ accessToken: string }> {
    try {
      const decoded = jwt.verify(refreshToken, this.refreshSecret) as any;
      const user = await this.findUserById(decoded.userId);
      
      if (!user) {
        throw new Error('Invalid refresh token');
      }

      const newAccessToken = this.generateAccessToken(user);
      
      logger.info('Token refreshed successfully', { userId: user.id });
      
      return { accessToken: newAccessToken };
    } catch (error) {
      logger.error('Token refresh failed', { error: error.message });
      throw new Error('Invalid refresh token');
    }
  }

  async logout(refreshToken: string): Promise<void> {
    try {
      // In real app, add token to blacklist
      logger.info('User logged out', { refreshToken: refreshToken.substring(0, 10) + '...' });
    } catch (error) {
      logger.error('Logout failed', { error: error.message });
      throw error;
    }
  }

  async verifyToken(token: string): Promise<any> {
    try {
      const decoded = jwt.verify(token, this.jwtSecret);
      return decoded;
    } catch (error) {
      logger.error('Token verification failed', { error: error.message });
      throw new Error('Invalid token');
    }
  }

  private generateAccessToken(user: User): string {
    return jwt.sign(
      { 
        userId: user.id, 
        email: user.email, 
        username: user.username 
      },
      this.jwtSecret,
      { expiresIn: this.jwtExpiry }
    );
  }

  private generateRefreshToken(user: User): string {
    return jwt.sign(
      { userId: user.id },
      this.refreshSecret,
      { expiresIn: this.refreshExpiry }
    );
  }

  private sanitizeUser(user: User): Omit<User, 'password'> {
    const { password, ...sanitizedUser } = user;
    return sanitizedUser;
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }

  // Mock database methods - replace with real database calls
  private async findUserByEmail(email: string): Promise<User | null> {
    // Mock implementation - replace with real database query
    return null;
  }

  private async findUserById(id: string): Promise<User | null> {
    // Mock implementation - replace with real database query
    return null;
  }
}
