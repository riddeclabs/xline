import { SetMetadata } from "@nestjs/common";

import { Role } from "src/common";

export const Roles = (...args: Role[]) => SetMetadata("roles", args);
