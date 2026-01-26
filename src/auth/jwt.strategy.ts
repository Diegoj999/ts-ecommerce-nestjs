import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: 'CLAVE_SECRETA_SUPER_DIFICIL', // ⚠️ Usa variables de entorno en producción
    });
  }

  async validate(payload: any) {
    // Esto inyecta el usuario en 'req.user'
    return { userId: payload.sub, email: payload.email, role: payload.role };
  }
}