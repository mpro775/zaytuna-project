"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SyncModule = void 0;
const common_1 = require("@nestjs/common");
const sync_service_1 = require("./sync.service");
const sync_controller_1 = require("./sync.controller");
const offline_service_1 = require("./offline.service");
const prisma_service_1 = require("../../shared/database/prisma.service");
const cache_service_1 = require("../../shared/cache/cache.service");
const audit_module_1 = require("../audit/audit.module");
let SyncModule = class SyncModule {
};
exports.SyncModule = SyncModule;
exports.SyncModule = SyncModule = __decorate([
    (0, common_1.Module)({
        imports: [(0, common_1.forwardRef)(() => audit_module_1.AuditModule)],
        controllers: [sync_controller_1.SyncController],
        providers: [sync_service_1.SyncService, offline_service_1.OfflineService, prisma_service_1.PrismaService, cache_service_1.CacheService],
        exports: [sync_service_1.SyncService, offline_service_1.OfflineService],
    })
], SyncModule);
//# sourceMappingURL=sync.module.js.map