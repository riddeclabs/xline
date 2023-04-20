import { Controller, Post, Body, UsePipes, ValidationPipe } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { LoginDto } from "./dto/login.dto";

@Controller("auth")
export class AuthController {
    constructor(private authService: AuthService) {}

    @Post("login")
    @UsePipes(ValidationPipe)
    login(@Body() loginDto: LoginDto) {
        return this.authService.login(loginDto);
    }
}
