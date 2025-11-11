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
exports.SalesController = void 0;
const common_1 = require("@nestjs/common");
const sales_service_1 = require("./sales.service");
const create_sales_invoice_dto_1 = require("./dto/create-sales-invoice.dto");
const update_sales_invoice_dto_1 = require("./dto/update-sales-invoice.dto");
const create_payment_dto_1 = require("./dto/create-payment.dto");
const permissions_decorator_1 = require("../../common/decorators/permissions.decorator");
let SalesController = class SalesController {
    salesService;
    constructor(salesService) {
        this.salesService = salesService;
    }
    createInvoice(createSalesInvoiceDto, req) {
        return this.salesService.create(createSalesInvoiceDto, req.user.id);
    }
    findAllInvoices(branchId, customerId, status, paymentStatus, limit) {
        return this.salesService.findAll(branchId, customerId, status, paymentStatus, limit ? parseInt(limit.toString()) : 50);
    }
    findOneInvoice(id) {
        return this.salesService.findOne(id);
    }
    updateInvoice(id, updateSalesInvoiceDto) {
        return this.salesService.update(id, updateSalesInvoiceDto);
    }
    cancelInvoice(id, reason, req) {
        return this.salesService.cancel(id, reason, req.user.id);
    }
    addPayment(id, createPaymentDto, req) {
        return this.salesService.addPayment(id, createPaymentDto, req.user.id);
    }
    getSalesStats(branchId, startDate, endDate) {
        const start = startDate ? new Date(startDate) : undefined;
        const end = endDate ? new Date(endDate) : undefined;
        return this.salesService.getSalesStats(branchId, start, end);
    }
    async printInvoice(id) {
        const invoice = await this.salesService.findOne(id);
        return {
            ...invoice,
            printData: {
                title: 'فاتورة مبيعات',
                date: new Date().toLocaleDateString('ar-SA'),
                invoice,
            },
        };
    }
    getCustomerInvoices(customerId) {
        return this.salesService.findAll(undefined, customerId);
    }
    getBranchInvoices(branchId) {
        return this.salesService.findAll(branchId);
    }
};
exports.SalesController = SalesController;
__decorate([
    (0, common_1.Post)('invoices'),
    (0, permissions_decorator_1.Permissions)('sales.create'),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_sales_invoice_dto_1.CreateSalesInvoiceDto, Object]),
    __metadata("design:returntype", void 0)
], SalesController.prototype, "createInvoice", null);
__decorate([
    (0, common_1.Get)('invoices'),
    (0, permissions_decorator_1.Permissions)('sales.read'),
    __param(0, (0, common_1.Query)('branchId')),
    __param(1, (0, common_1.Query)('customerId')),
    __param(2, (0, common_1.Query)('status')),
    __param(3, (0, common_1.Query)('paymentStatus')),
    __param(4, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String, Number]),
    __metadata("design:returntype", void 0)
], SalesController.prototype, "findAllInvoices", null);
__decorate([
    (0, common_1.Get)('invoices/:id'),
    (0, permissions_decorator_1.Permissions)('sales.read'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], SalesController.prototype, "findOneInvoice", null);
__decorate([
    (0, common_1.Patch)('invoices/:id'),
    (0, permissions_decorator_1.Permissions)('sales.update'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_sales_invoice_dto_1.UpdateSalesInvoiceDto]),
    __metadata("design:returntype", void 0)
], SalesController.prototype, "updateInvoice", null);
__decorate([
    (0, common_1.Delete)('invoices/:id/cancel'),
    (0, permissions_decorator_1.Permissions)('sales.update'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)('reason')),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", void 0)
], SalesController.prototype, "cancelInvoice", null);
__decorate([
    (0, common_1.Post)('invoices/:id/payments'),
    (0, permissions_decorator_1.Permissions)('sales.update'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, create_payment_dto_1.CreatePaymentDto, Object]),
    __metadata("design:returntype", void 0)
], SalesController.prototype, "addPayment", null);
__decorate([
    (0, common_1.Get)('stats'),
    (0, permissions_decorator_1.Permissions)('sales.read'),
    __param(0, (0, common_1.Query)('branchId')),
    __param(1, (0, common_1.Query)('startDate')),
    __param(2, (0, common_1.Query)('endDate')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", void 0)
], SalesController.prototype, "getSalesStats", null);
__decorate([
    (0, common_1.Get)('invoices/:id/print'),
    (0, permissions_decorator_1.Permissions)('sales.read'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], SalesController.prototype, "printInvoice", null);
__decorate([
    (0, common_1.Get)('customers/:customerId/invoices'),
    (0, permissions_decorator_1.Permissions)('sales.read'),
    __param(0, (0, common_1.Param)('customerId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], SalesController.prototype, "getCustomerInvoices", null);
__decorate([
    (0, common_1.Get)('branches/:branchId/invoices'),
    (0, permissions_decorator_1.Permissions)('sales.read'),
    __param(0, (0, common_1.Param)('branchId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], SalesController.prototype, "getBranchInvoices", null);
exports.SalesController = SalesController = __decorate([
    (0, common_1.Controller)('sales'),
    __metadata("design:paramtypes", [sales_service_1.SalesService])
], SalesController);
//# sourceMappingURL=sales.controller.js.map