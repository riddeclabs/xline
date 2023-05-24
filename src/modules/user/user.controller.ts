import { Controller, Get, Param } from "@nestjs/common";
import { UserService } from "./user.service";
import { ApiTags } from "@nestjs/swagger";

@ApiTags("User")
@Controller("user")
export class UserController {
    constructor(private readonly userService: UserService) {}

    @Get()
    getAllUsers() {
        return this.userService.getAllUsers();
    }

    @Get(":chatId")
    getUserByChatId(@Param("chatId") chatId: string) {
        return this.userService.getUserByChatId(+chatId);
    }
}
