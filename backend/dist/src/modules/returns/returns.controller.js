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
exports.ReturnsController = void 0;
const common_1 = require("@nestjs/common");
const returns_service_1 = require("./returns.service");
const create_return_dto_1 = require("./dto/create-return.dto");
const update_return_dto_1 = require("./dto/update-return.dto");
const create_credit_note_dto_1 = require("./dto/create-credit-note.dto");
const permissions_decorator_1 = require("../../common/decorators/permissions.decorator");
const common_2 = require("@nestjs/common");
let ReturnsController = class ReturnsController {
    returnsService;
    constructor(returnsService) {
        this.returnsService = returnsService;
    }
    createReturn(createReturnDto, req) {
        return this.returnsService.create(createReturnDto, req.user.id);
    }
    findAllReturns(salesInvoiceId, customerId, status, refundStatus, limit) {
        return this.returnsService.findAll(salesInvoiceId, customerId, status, refundStatus, limit ? parseInt(limit.toString()) : 50);
    }
    findOneReturn(id) {
        return this.returnsService.findOne(id);
    }
    updateReturn(id, updateReturnDto) {
        return this.returnsService.update(id, updateReturnDto);
    }
    cancelReturn(id, reason, req) {
        return this.returnsService.cancel(id, reason, req.user.id);
    }
    createCreditNote(id, createCreditNoteDto, req) {
        return this.returnsService.createCreditNote(id, createCreditNoteDto, req.user.id);
    }
    getReturnsStats(startDate, endDate) {
        const start = startDate ? new Date(startDate) : undefined;
        const end = endDate ? new Date(endDate) : undefined;
        return this.returnsService.getReturnsStats(start, end);
    }
    getSalesInvoiceReturns(salesInvoiceId) {
        return this.returnsService.findAll(salesInvoiceId);
    }
    getCustomerReturns(customerId) {
        return this.returnsService.findAll(undefined, customerId);
    }
};
exports.ReturnsController = ReturnsController;
__decorate([
    (0, common_1.Post)(),
    (0, permissions_decorator_1.Permissions)('returns.create'),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_2.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_return_dto_1.CreateReturnDto, Object]),
    __metadata("design:returntype", void 0)
], ReturnsController.prototype, "createReturn", null);
__decorate([
    (0, common_1.Get)(),
    (0, permissions_decorator_1.Permissions)('returns.read'),
    __param(0, (0, common_1.Query)('salesInvoiceId')),
    __param(1, (0, common_1.Query)('customerId')),
    __param(2, (0, common_1.Query)('status')),
    __param(3, (0, common_1.Query)('refundStatus')),
    __param(4, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String, Number]),
    __metadata("design:returntype", void 0)
], ReturnsController.prototype, "findAllReturns", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, permissions_decorator_1.Permissions)('returns.read'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ReturnsController.prototype, "findOneReturn", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, permissions_decorator_1.Permissions)('returns.update'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_return_dto_1.UpdateReturnDto]),
    __metadata("design:returntype", void 0)
], ReturnsController.prototype, "updateReturn", null);
__decorate([
    (0, common_1.Delete)(':id/cancel'),
    (0, permissions_decorator_1.Permissions)('returns.update'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)('reason')),
    __param(2, (0, common_2.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", void 0)
], ReturnsController.prototype, "cancelReturn", null);
__decorate([
    (0, common_1.Post)(':id/credit-notes'),
    (0, permissions_decorator_1.Permissions)('returns.update'),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_2.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, create_credit_note_dto_1.CreateCreditNoteDto, Object]),
    __metadata("design:returntype", void 0)
], ReturnsController.prototype, "createCreditNote", null);
__decorate([
    (0, common_1.Get)('stats/overview'),
    (0, permissions_decorator_1.Permissions)('returns.read'),
    __param(0, (0, common_1.Query)('startDate')),
    __param(1, (0, common_1.Query)('endDate')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], ReturnsController.prototype, "getReturnsStats", null);
__decorate([
    (0, common_1.Get)('sales-invoices/:salesInvoiceId/returns'),
    (0, permissions_decorator_1.Permissions)('returns.read'),
    __param(0, (0, common_1.Param)('salesInvoiceId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ReturnsController.prototype, "getSalesInvoiceReturns", null);
__decorate([
    (0, common_1.Get)('customers/:customerId/returns'),
    (0, permissions_decorator_1.Permissions)('returns.read'),
    __param(0, (0, common_1.Param)('customerId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ReturnsController.prototype, "getCustomerReturns", null);
exports.ReturnsController = ReturnsController = __decorate([
    (0, common_1.Controller)('returns'),
    __metadata("design:paramtypes", [returns_service_1.ReturnsService])
], ReturnsController);
//# sourceMappingURL=returns.controller.js.map