import { Injectable } from "@nestjs/common";
import { CreateUserDto } from "./dto/create-user.dto";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { User } from "../../database/entities";

@Injectable()
export class UserService {
    constructor(@InjectRepository(User) private userRepo: Repository<User>) {}

    async getAllUsers() {
        return this.userRepo.findAndCount();
    }

    async getUserByChatId(chatId: number) {
        return this.userRepo.findOne({
            where: { chat_id: chatId },
        });
    }

    async createUser(createUserDto: CreateUserDto) {
        const newUser = this.userRepo.create(createUserDto);
        return this.userRepo.save(newUser);
    }

    async updateUserName(userId: number, newName: string) {
        const res = await this.userRepo.update({ id: userId }, { name: newName });
        return res.raw as User;
    }
}
