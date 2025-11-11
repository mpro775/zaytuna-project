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
exports.PurchasingController = void 0;
const common_1 = require("@nestjs/common");
const purchasing_service_1 = require("./purchasing.service");
const create_supplier_dto_1 = require("./dto/create-supplier.dto");
const update_supplier_dto_1 = require("./dto/update-supplier.dto");
const create_purchase_order_dto_1 = require("./dto/create-purchase-order.dto");
const create_purchase_invoice_dto_1 = require("./dto/create-purchase-invoice.dto");
const create_purchase_payment_dto_1 = require("./dto/create-purchase-payment.dto");
const permissions_decorator_1 = require("../../common/decorators/permissions.decorator");
const common_2 = require("@nestjs/common");
let PurchasingController = class PurchasingController {
    purchasingService;
    constructor(purchasingService) {
        this.purchasingService = purchasingService;
    }
    createSupplier(createSupplierDto) {
        return this.purchasingService.createSupplier(createSupplierDto);
    }
    findAllSuppliers(search, isActive, limit) {
        const active = isActive === 'true' ? true : isActive === 'false' ? false : undefined;
        return this.purchasingService.findAllSuppliers(search, active, limit ? parseInt(limit.toString()) : 50);
    }
    findOneSupplier(id) {
        return this.purchasingService.findOneSupplier(id);
    }
    updateSupplier(id, updateSupplierDto) {
        return this.purchasingService.updateSupplier(id, updateSupplierDto);
    }
    removeSupplier(id) {
        return this.purchasingService.removeSupplier(id);
    }
    createPurchaseOrder(createPurchaseOrderDto, req) {
        return this.purchasingService.createPurchaseOrder(createPurchaseOrderDto, req.user.id);
    }
    findAllPurchaseOrders(supplierId, status, limit) {
        return this.purchasingService.findAllPurchaseOrders(supplierId, status, limit ? parseInt(limit.toString()) : 50);
    }
    updatePurchaseOrderStatus(id, status, req) {
        return this.purchasingService.updatePurchaseOrderStatus(id, status, req.user.id);
    }
    createPurchaseInvoice(createPurchaseInvoiceDto, req) {
        return this.purchasingService.createPurchaseInvoice(createPurchaseInvoiceDto, req.user.id);
    }
    createPurchasePayment(id, createPurchasePaymentDto, req) {
        return this.purchasingService.createPurchasePayment(id, createPurchasePaymentDto, req.user.id);
    }
    getPurchasingStats(startDate, endDate) {
        const start = startDate ? new Date(startDate) : undefined;
        const end = endDate ? new Date(endDate) : undefined;
        return this.purchasingService.getPurchasingStats(start, end);
    }
    getSupplierPurchaseOrders(supplierId) {
        return this.purchasingService.findAllPurchaseOrders(supplierId);
    }
    getSupplierPurchaseInvoices(supplierId) {
        return { message: 'سيتم إضافة هذه الوظيفة قريباً' };
    }
};
exports.PurchasingController = PurchasingController;
__decorate([
    (0, common_1.Post)('suppliers'),
    (0, permissions_decorator_1.Permissions)('purchasing.suppliers.create'),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_supplier_dto_1.CreateSupplierDto]),
    __metadata("design:returntype", void 0)
], PurchasingController.prototype, "createSupplier", null);
__decorate([
    (0, common_1.Get)('suppliers'),
    (0, permissions_decorator_1.Permissions)('purchasing.suppliers.read'),
    __param(0, (0, common_1.Query)('search')),
    __param(1, (0, common_1.Query)('isActive')),
    __param(2, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Number]),
    __metadata("design:returntype", void 0)
], PurchasingController.prototype, "findAllSuppliers", null);
__decorate([
    (0, common_1.Get)('suppliers/:id'),
    (0, permissions_decorator_1.Permissions)('purchasing.suppliers.read'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], PurchasingController.prototype, "findOneSupplier", null);
__decorate([
    (0, common_1.Patch)('suppliers/:id'),
    (0, permissions_decorator_1.Permissions)('purchasing.suppliers.update'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_supplier_dto_1.UpdateSupplierDto]),
    __metadata("design:returntype", void 0)
], PurchasingController.prototype, "updateSupplier", null);
__decorate([
    (0, common_1.Delete)('suppliers/:id'),
    (0, permissions_decorator_1.Permissions)('purchasing.suppliers.delete'),
    (0, common_1.HttpCode)(common_1.HttpStatus.NO_CONTENT),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], PurchasingController.prototype, "removeSupplier", null);
__decorate([
    (0, common_1.Post)('orders'),
    (0, permissions_decorator_1.Permissions)('purchasing.orders.create'),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_2.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_purchase_order_dto_1.CreatePurchaseOrderDto, Object]),
    __metadata("design:returntype", void 0)
], PurchasingController.prototype, "createPurchaseOrder", null);
__decorate([
    (0, common_1.Get)('orders'),
    (0, permissions_decorator_1.Permissions)('purchasing.orders.read'),
    __param(0, (0, common_1.Query)('supplierId')),
    __param(1, (0, common_1.Query)('status')),
    __param(2, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Number]),
    __metadata("design:returntype", void 0)
], PurchasingController.prototype, "findAllPurchaseOrders", null);
__decorate([
    (0, common_1.Patch)('orders/:id/status'),
    (0, permissions_decorator_1.Permissions)('purchasing.orders.update'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)('status')),
    __param(2, (0, common_2.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", void 0)
], PurchasingController.prototype, "updatePurchaseOrderStatus", null);
__decorate([
    (0, common_1.Post)('invoices'),
    (0, permissions_decorator_1.Permissions)('purchasing.invoices.create'),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_2.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_purchase_invoice_dto_1.CreatePurchaseInvoiceDto, Object]),
    __metadata("design:returntype", void 0)
], PurchasingController.prototype, "createPurchaseInvoice", null);
__decorate([
    (0, common_1.Post)('invoices/:id/payments'),
    (0, permissions_decorator_1.Permissions)('purchasing.payments.create'),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_2.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, create_purchase_payment_dto_1.CreatePurchasePaymentDto, Object]),
    __metadata("design:returntype", void 0)
], PurchasingController.prototype, "createPurchasePayment", null);
__decorate([
    (0, common_1.Get)('stats/overview'),
    (0, permissions_decorator_1.Permissions)('purchasing.reports.read'),
    __param(0, (0, common_1.Query)('startDate')),
    __param(1, (0, common_1.Query)('endDate')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], PurchasingController.prototype, "getPurchasingStats", null);
__decorate([
    (0, common_1.Get)('suppliers/:supplierId/orders'),
    (0, permissions_decorator_1.Permissions)('purchasing.orders.read'),
    __param(0, (0, common_1.Param)('supplierId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], PurchasingController.prototype, "getSupplierPurchaseOrders", null);
__decorate([
    (0, common_1.Get)('suppliers/:supplierId/invoices'),
    (0, permissions_decorator_1.Permissions)('purchasing.invoices.read'),
    __param(0, (0, common_1.Param)('supplierId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], PurchasingController.prototype, "getSupplierPurchaseInvoices", null);
exports.PurchasingController = PurchasingController = __decorate([
    (0, common_1.Controller)('purchasing'),
    __metadata("design:paramtypes", [purchasing_service_1.PurchasingService])
], PurchasingController);
//# sourceMappingURL=purchasing.controller.js.map