import { CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../../shared/database/prisma.service';
export declare const ROLES_KEY = "roles";
export declare class RoleGuard implements CanActivate {
    private readonly reflector;
    private readonly prisma;
    private readonly logger;
    constructor(reflector: Reflector, prisma: PrismaService);
    canActivate(context: ExecutionContext): Promise<boolean>;
}
