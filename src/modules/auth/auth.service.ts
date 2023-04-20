import { Injectable, BadRequestException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcrypt";
import { Operator } from "src/database/entities";
import { OperatorsService } from "src/modules/operators/operators.service";
import { LoginDto } from "./dto/login.dto";

@Injectable()
export class AuthService {
    constructor(private operatorsService: OperatorsService, private jwtService: JwtService) {}

    async login(loginDto: LoginDto) {
        const user = await this.operatorsService.findByUsername(loginDto.username);

        if (!user || !(await bcrypt.compare(loginDto.password, user.password))) {
            throw new BadRequestException();
        }

        const payload = { username: user.username, id: user.id };

        return {
            access_token: this.jwtService.sign(payload),
        };
    }

    async validateUser(loginDto: LoginDto): Promise<Omit<Operator, "password"> | null> {
        const user = await this.operatorsService.findByUsername(loginDto.username);
        if (user) {
            const { password, ...data } = user;
            if (await bcrypt.compare(loginDto.password, password)) {
                return data;
            }
        }
        return null;
    }
}
