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
exports.InventoryController = void 0;
const common_1 = require("@nestjs/common");
const inventory_service_1 = require("./inventory.service");
const create_stock_item_dto_1 = require("./dto/create-stock-item.dto");
const update_stock_item_dto_1 = require("./dto/update-stock-item.dto");
const adjust_stock_dto_1 = require("./dto/adjust-stock.dto");
const permissions_decorator_1 = require("../../common/decorators/permissions.decorator");
let InventoryController = class InventoryController {
    inventoryService;
    constructor(inventoryService) {
        this.inventoryService = inventoryService;
    }
    createStockItem(createStockItemDto) {
        return this.inventoryService.createStockItem(createStockItemDto);
    }
    findAllStockItems(warehouseId, lowStockOnly) {
        return this.inventoryService.findAllStockItems(warehouseId, lowStockOnly === true);
    }
    findStockItemById(id) {
        return this.inventoryService.findStockItemById(id);
    }
    updateStockItem(id, updateStockItemDto) {
        return this.inventoryService.updateStockItem(id, updateStockItemDto);
    }
    adjustStock(warehouseId, productVariantId, adjustStockDto) {
        return this.inventoryService.adjustStock(warehouseId, productVariantId, adjustStockDto);
    }
    findStockMovements(warehouseId, productVariantId, limit) {
        return this.inventoryService.findStockMovements(warehouseId, productVariantId, limit ? parseInt(limit.toString()) : 50);
    }
    getLowStockAlerts() {
        return this.inventoryService.getLowStockAlerts();
    }
    getInventoryStats() {
        return this.inventoryService.getInventoryStats();
    }
    async getProductStockAcrossWarehouses(productVariantId) {
        return this.inventoryService.findAllStockItems().then(items => items.filter(item => item.productVariantId === productVariantId));
    }
    getWarehouseStock(warehouseId) {
        return this.inventoryService.findAllStockItems(warehouseId);
    }
};
exports.InventoryController = InventoryController;
__decorate([
    (0, common_1.Post)('stock-items'),
    (0, permissions_decorator_1.Permissions)('inventory.create'),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_stock_item_dto_1.CreateStockItemDto]),
    __metadata("design:returntype", void 0)
], InventoryController.prototype, "createStockItem", null);
__decorate([
    (0, common_1.Get)('stock-items'),
    (0, permissions_decorator_1.Permissions)('inventory.read'),
    __param(0, (0, common_1.Query)('warehouseId')),
    __param(1, (0, common_1.Query)('lowStockOnly')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Boolean]),
    __metadata("design:returntype", void 0)
], InventoryController.prototype, "findAllStockItems", null);
__decorate([
    (0, common_1.Get)('stock-items/:id'),
    (0, permissions_decorator_1.Permissions)('inventory.read'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], InventoryController.prototype, "findStockItemById", null);
__decorate([
    (0, common_1.Patch)('stock-items/:id'),
    (0, permissions_decorator_1.Permissions)('inventory.update'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_stock_item_dto_1.UpdateStockItemDto]),
    __metadata("design:returntype", void 0)
], InventoryController.prototype, "updateStockItem", null);
__decorate([
    (0, common_1.Post)('stock-items/:warehouseId/:productVariantId/adjust'),
    (0, permissions_decorator_1.Permissions)('inventory.update'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Param)('warehouseId')),
    __param(1, (0, common_1.Param)('productVariantId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, adjust_stock_dto_1.AdjustStockDto]),
    __metadata("design:returntype", void 0)
], InventoryController.prototype, "adjustStock", null);
__decorate([
    (0, common_1.Get)('movements'),
    (0, permissions_decorator_1.Permissions)('inventory.read'),
    __param(0, (0, common_1.Query)('warehouseId')),
    __param(1, (0, common_1.Query)('productVariantId')),
    __param(2, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Number]),
    __metadata("design:returntype", void 0)
], InventoryController.prototype, "findStockMovements", null);
__decorate([
    (0, common_1.Get)('alerts/low-stock'),
    (0, permissions_decorator_1.Permissions)('inventory.read'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], InventoryController.prototype, "getLowStockAlerts", null);
__decorate([
    (0, common_1.Get)('stats'),
    (0, permissions_decorator_1.Permissions)('inventory.read'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], InventoryController.prototype, "getInventoryStats", null);
__decorate([
    (0, common_1.Get)('products/:productVariantId/stock'),
    (0, permissions_decorator_1.Permissions)('inventory.read'),
    __param(0, (0, common_1.Param)('productVariantId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], InventoryController.prototype, "getProductStockAcrossWarehouses", null);
__decorate([
    (0, common_1.Get)('warehouses/:warehouseId/stock'),
    (0, permissions_decorator_1.Permissions)('inventory.read'),
    __param(0, (0, common_1.Param)('warehouseId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], InventoryController.prototype, "getWarehouseStock", null);
exports.InventoryController = InventoryController = __decorate([
    (0, common_1.Controller)('inventory'),
    __metadata("design:paramtypes", [inventory_service_1.InventoryService])
], InventoryController);
//# sourceMappingURL=inventory.controller.js.map