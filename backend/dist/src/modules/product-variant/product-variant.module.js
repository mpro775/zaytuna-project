"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductVariantModule = void 0;
const common_1 = require("@nestjs/common");
const product_variant_service_1 = require("./product-variant.service");
const product_variant_controller_1 = require("./product-variant.controller");
const prisma_service_1 = require("../../shared/database/prisma.service");
const cache_service_1 = require("../../shared/cache/cache.service");
let ProductVariantModule = class ProductVariantModule {
};
exports.ProductVariantModule = ProductVariantModule;
exports.ProductVariantModule = ProductVariantModule = __decorate([
    (0, common_1.Module)({
        controllers: [product_variant_controller_1.ProductVariantController],
        providers: [product_variant_service_1.ProductVariantService, prisma_service_1.PrismaService, cache_service_1.CacheService],
        exports: [product_variant_service_1.ProductVariantService],
    })
], ProductVariantModule);
//# sourceMappingURL=product-variant.module.js.map