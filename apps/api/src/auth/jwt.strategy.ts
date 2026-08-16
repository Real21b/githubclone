import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

interface JwtPayload {
  sub: string;
  username: string;
  email: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    const secret = process.env.JWT_SECRET;
    // Fallback YOK: sir tanimsizsa uygulama acilmamali. Onceki surumde
    // 'your-secret-key' varsayilani vardi ve token'lari herkesin bildigi bir
    // sirla imzaliyordu.
    if (!secret) {
      throw new Error('JWT_SECRET tanimli degil - JwtStrategy baslatilamaz');
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }

  async validate(payload: JwtPayload) {
    return { userId: payload.sub, username: payload.username, email: payload.email };
  }
}
