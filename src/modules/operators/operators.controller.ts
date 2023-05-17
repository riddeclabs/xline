import {
    Controller,
    Get,
    Post,
    Body,
    UsePipes,
    ValidationPipe,
    UseGuards,
    Request,
} from "@nestjs/common";

import { JwtAuthGuard } from "src/guards";

import { CreateOperatorDto } from "./dto/create-operator.dto";
import { OperatorsService } from "./operators.service";
import { ApiTags } from "@nestjs/swagger";

@ApiTags("Admins")
@Controller("admins")
export class OperatorsController {
    constructor(private readonly operatorsService: OperatorsService) {}

    @Post()
    @UsePipes(ValidationPipe)
    async createAccount(@Body() createOperatorDto: CreateOperatorDto) {
        await this.operatorsService.create(createOperatorDto);
    }

    @UseGuards(JwtAuthGuard)
    @Get("profile")
    getProfile(@Request() req: { user: { id: number; username: string } }) {
        return req.user;
    }
}
