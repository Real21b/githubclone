import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { User } from '../user/user.entity';
import { UserService } from '../user/user.service';
import { LoginInput } from './dto/login.input';
import { RegisterInput } from './dto/register.input';

/** Parola alani cikarilmis kullanici. */
type SafeUser = Omit<User, 'password'>;

@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private jwtService: JwtService,
  ) {}

  async validateUser(email: string, password: string): Promise<SafeUser | null> {
    const user = await this.userService.findByEmail(email);
    if (user && (await this.userService.validatePassword(password, user.password))) {
      // `password` disarida birakilir; degisken adi parametreyi golgelemesin
      const { password: _hashed, ...result } = user;
      return result;
    }
    return null;
  }

  async login(loginInput: LoginInput) {
    const user = await this.validateUser(loginInput.email, loginInput.password);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = { email: user.email, sub: user.id, username: user.username };
    return {
      access_token: this.jwtService.sign(payload),
      user,
    };
  }

  async register(registerInput: RegisterInput) {
    const existingUser = await this.userService.findByEmail(registerInput.email);
    if (existingUser) {
      throw new UnauthorizedException('User already exists');
    }

    const user = await this.userService.create(registerInput);
    const { password, ...result } = user;

    const payload = { email: user.email, sub: user.id, username: user.username };
    return {
      access_token: this.jwtService.sign(payload),
      user: result,
    };
  }
}
