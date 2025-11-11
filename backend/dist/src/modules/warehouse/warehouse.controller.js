"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WarehouseController = void 0;
const common_1 = require("@nestjs/common");
const warehouse_service_1 = require("./warehouse.service");
const create_warehouse_dto_1 = require("./dto/create-warehouse.dto");
const update_warehouse_dto_1 = require("./dto/update-warehouse.dto");
const transfer_stock_dto_1 = require("./dto/transfer-stock.dto");
const permissions_decorator_1 = require("../../common/decorators/permissions.decorator");
let WarehouseController = class WarehouseController {
    warehouseService;
    constructor(warehouseService) {
        this.warehouseService = warehouseService;
    }
    create(createWarehouseDto) {
        return this.warehouseService.create(createWarehouseDto);
    }
    findAll(branchId) {
        return this.warehouseService.findAll(branchId);
    }
    getWarehouseStats() {
        return this.warehouseService.getWarehouseStats();
    }
    findOne(id) {
        return this.warehouseService.findOne(id);
    }
    getStockItemsByWarehouse(id) {
        return this.warehouseService.getStockItemsByWarehouse(id);
    }
    update(id, updateWarehouseDto) {
        return this.warehouseService.update(id, updateWarehouseDto);
    }
    transferStock(transferStockDto) {
        return this.warehouseService.transferStock(transferStockDto.fromWarehouseId, transferStockDto.toWarehouseId, transferStockDto.productVariantId, transferStockDto.quantity, transferStockDto.notes);
    }
    remove(id) {
        return this.warehouseService.remove(id);
    }
};
exports.WarehouseController = WarehouseController;
__decorate([
    (0, common_1.Post)(),
    (0, permissions_decorator_1.Permissions)('branches.manage'),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_warehouse_dto_1.CreateWarehouseDto]),
    __metadata("design:returntype", void 0)
], WarehouseController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, permissions_decorator_1.Permissions)('inventory.read'),
    __param(0, (0, common_1.Query)('branchId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], WarehouseController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('stats'),
    (0, permissions_decorator_1.Permissions)('inventory.read'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], WarehouseController.prototype, "getWarehouseStats", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, permissions_decorator_1.Permissions)('inventory.read'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], WarehouseController.prototype, "findOne", null);
__decorate([
    (0, common_1.Get)(':id/stock'),
    (0, permissions_decorator_1.Permissions)('inventory.read'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], WarehouseController.prototype, "getStockItemsByWarehouse", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, permissions_decorator_1.Permissions)('branches.manage'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_warehouse_dto_1.UpdateWarehouseDto]),
    __metadata("design:returntype", void 0)
], WarehouseController.prototype, "update", null);
__decorate([
    (0, common_1.Post)('transfer-stock'),
    (0, permissions_decorator_1.Permissions)('inventory.transfer'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [transfer_stock_dto_1.TransferStockDto]),
    __metadata("design:returntype", void 0)
], WarehouseController.prototype, "transferStock", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, permissions_decorator_1.Permissions)('branches.manage'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], WarehouseController.prototype, "remove", null);
exports.WarehouseController = WarehouseController = __decorate([
    (0, common_1.Controller)('warehouses'),
    __metadata("design:paramtypes", [warehouse_service_1.WarehouseService])
], WarehouseController);
//# sourceMappingURL=warehouse.controller.js.map