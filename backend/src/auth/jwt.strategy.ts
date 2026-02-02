import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { passportJwtSecret } from 'jwks-rsa';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      audience: configService.get<string>('COGNITO_CLIENT_ID'),
      issuer: `https://cognito-idp.${configService.get<string>('COGNITO_REGION')}.amazonaws.com/${configService.get<string>('COGNITO_USER_POOL_ID')}`,
      algorithms: ['RS256'],
      secretOrKeyProvider: passportJwtSecret({
        cache: true,
        rateLimit: true,
        jwksRequestsPerMinute: 5,
        jwksUri: `https://cognito-idp.${configService.get<string>('COGNITO_REGION')}.amazonaws.com/${configService.get<string>('COGNITO_USER_POOL_ID')}/.well-known/jwks.json`,
      }),
    });
  }

  async validate(payload: any) {
    const cognitoSub = payload.sub;
    if (!cognitoSub) {
      throw new UnauthorizedException('Invalid token claims');
    }

    let user = await this.userRepository.findOne({ where: { cognitoSub } });

    if (!user) {
      user = this.userRepository.create({ cognitoSub });
      try {
        await this.userRepository.save(user);
      } catch (e) {
        // Handle race condition
        user = await this.userRepository.findOne({ where: { cognitoSub } });
        if (!user) throw new UnauthorizedException('Could not create user');
      }
    }

    return user;
  }
}
