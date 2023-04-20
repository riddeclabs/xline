import { Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { OperatorsService } from "src/modules/operators/operators.service";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(private operatorsService: OperatorsService, private configService: ConfigService) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: configService.get<string>("JWT_SECRET_KEY"),
        });
    }

    async validate(payload: { id: number; username: string }) {
        const user = await this.operatorsService.findByUsername(payload.username);

        if (!user || user.id !== payload.id) {
            throw new UnauthorizedException();
        }

        return { id: payload.id, username: payload.username };
    }
}
