import { Injectable, BadRequestException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { InjectRepository } from "@nestjs/typeorm";

import * as bcrypt from "bcrypt";
import { Repository } from "typeorm";

import { Operator } from "src/database/entities";

import { CreateOperatorDto } from "./dto/create-operator.dto";

@Injectable()
export class OperatorsService {
    constructor(
        @InjectRepository(Operator)
        private operatorRepository: Repository<Operator>,
        private configService: ConfigService
    ) {}

    async create(createOperatorDto: CreateOperatorDto) {
        const operator = await this.findByUsername(createOperatorDto.username);

        if (operator) {
            throw new BadRequestException();
        } else {
            const hash = await bcrypt.hash(
                createOperatorDto.password,
                +this.configService.get("HASH_SALT")
            );

            const newAdmin = this.operatorRepository.create({
                username: createOperatorDto.username,
                password: hash,
                role: createOperatorDto.role,
            });

            return this.operatorRepository.save(newAdmin);
        }
    }

    async findByUsername(username: string) {
        return this.operatorRepository.findOneBy({ username });
    }
}
