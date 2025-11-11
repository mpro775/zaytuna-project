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
exports.AccountingController = void 0;
const common_1 = require("@nestjs/common");
const accounting_service_1 = require("./accounting.service");
const create_gl_account_dto_1 = require("./dto/create-gl-account.dto");
const update_gl_account_dto_1 = require("./dto/update-gl-account.dto");
const create_journal_entry_dto_1 = require("./dto/create-journal-entry.dto");
const permissions_decorator_1 = require("../../common/decorators/permissions.decorator");
let AccountingController = class AccountingController {
    accountingService;
    constructor(accountingService) {
        this.accountingService = accountingService;
    }
    createGLAccount(createGLAccountDto) {
        return this.accountingService.createGLAccount(createGLAccountDto);
    }
    findAllGLAccounts(includeInactive, accountType) {
        return this.accountingService.findAllGLAccounts(includeInactive === 'true', accountType);
    }
    findGLAccountById(id) {
        return this.accountingService.findGLAccountById(id);
    }
    updateGLAccount(id, updateGLAccountDto) {
        return this.accountingService.updateGLAccount(id, updateGLAccountDto);
    }
    removeGLAccount(id) {
        return this.accountingService.removeGLAccount(id);
    }
    createJournalEntry(createJournalEntryDto, req) {
        return this.accountingService.createJournalEntry(createJournalEntryDto, req.user.id);
    }
    findAllJournalEntries(status, sourceModule, startDate, endDate, limit) {
        return this.accountingService.findAllJournalEntries(status, sourceModule, startDate ? new Date(startDate) : undefined, endDate ? new Date(endDate) : undefined, limit ? parseInt(limit.toString()) : 50);
    }
    findJournalEntryById(id) {
        return this.accountingService.findJournalEntryById(id);
    }
    postJournalEntry(id) {
        return this.accountingService.postJournalEntry(id);
    }
    unpostJournalEntry(id) {
        return this.accountingService.unpostJournalEntry(id);
    }
    async createDefaultSystemAccounts() {
        await this.accountingService.createDefaultSystemAccounts();
        return { message: 'تم إنشاء حسابات النظام الافتراضية بنجاح' };
    }
    getAccountingStats(startDate, endDate) {
        return this.accountingService.getAccountingStats(startDate ? new Date(startDate) : undefined, endDate ? new Date(endDate) : undefined);
    }
    createSalesJournalEntry(salesInvoiceId, customerId, totalAmount, taxAmount, req) {
        return this.accountingService.createSalesJournalEntry(salesInvoiceId, customerId, totalAmount, taxAmount, req.user.id);
    }
    createPurchaseJournalEntry(purchaseInvoiceId, supplierId, totalAmount, taxAmount, req) {
        return this.accountingService.createPurchaseJournalEntry(purchaseInvoiceId, supplierId, totalAmount, taxAmount, req.user.id);
    }
    getBalanceSheetReport(asOfDate) {
        return { message: 'تقرير الميزانية العمومية - سيتم إضافة قريباً' };
    }
    getProfitLossReport(startDate, endDate) {
        return { message: 'تقرير الأرباح والخسائر - سيتم إضافة قريباً' };
    }
    getAccountMovementReport(accountId, startDate, endDate) {
        return { message: 'تقرير حركة الحسابات - سيتم إضافة قريباً' };
    }
    exportTrialBalance(asOfDate) {
        return { message: 'تصدير ميزان المراجعة - سيتم إضافة قريباً' };
    }
    exportJournalEntries(startDate, endDate, format) {
        return { message: 'تصدير القيود اليومية - سيتم إضافة قريباً' };
    }
};
exports.AccountingController = AccountingController;
__decorate([
    (0, common_1.Post)('gl-accounts'),
    (0, permissions_decorator_1.Permissions)('accounting.gl_accounts.create'),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_gl_account_dto_1.CreateGLAccountDto]),
    __metadata("design:returntype", void 0)
], AccountingController.prototype, "createGLAccount", null);
__decorate([
    (0, common_1.Get)('gl-accounts'),
    (0, permissions_decorator_1.Permissions)('accounting.gl_accounts.read'),
    __param(0, (0, common_1.Query)('includeInactive')),
    __param(1, (0, common_1.Query)('accountType')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], AccountingController.prototype, "findAllGLAccounts", null);
__decorate([
    (0, common_1.Get)('gl-accounts/:id'),
    (0, permissions_decorator_1.Permissions)('accounting.gl_accounts.read'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], AccountingController.prototype, "findGLAccountById", null);
__decorate([
    (0, common_1.Patch)('gl-accounts/:id'),
    (0, permissions_decorator_1.Permissions)('accounting.gl_accounts.update'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_gl_account_dto_1.UpdateGLAccountDto]),
    __metadata("design:returntype", void 0)
], AccountingController.prototype, "updateGLAccount", null);
__decorate([
    (0, common_1.Delete)('gl-accounts/:id'),
    (0, permissions_decorator_1.Permissions)('accounting.gl_accounts.delete'),
    (0, common_1.HttpCode)(common_1.HttpStatus.NO_CONTENT),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], AccountingController.prototype, "removeGLAccount", null);
__decorate([
    (0, common_1.Post)('journal-entries'),
    (0, permissions_decorator_1.Permissions)('accounting.journal_entries.create'),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_journal_entry_dto_1.CreateJournalEntryDto, Object]),
    __metadata("design:returntype", void 0)
], AccountingController.prototype, "createJournalEntry", null);
__decorate([
    (0, common_1.Get)('journal-entries'),
    (0, permissions_decorator_1.Permissions)('accounting.journal_entries.read'),
    __param(0, (0, common_1.Query)('status')),
    __param(1, (0, common_1.Query)('sourceModule')),
    __param(2, (0, common_1.Query)('startDate')),
    __param(3, (0, common_1.Query)('endDate')),
    __param(4, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String, Number]),
    __metadata("design:returntype", void 0)
], AccountingController.prototype, "findAllJournalEntries", null);
__decorate([
    (0, common_1.Get)('journal-entries/:id'),
    (0, permissions_decorator_1.Permissions)('accounting.journal_entries.read'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], AccountingController.prototype, "findJournalEntryById", null);
__decorate([
    (0, common_1.Patch)('journal-entries/:id/post'),
    (0, permissions_decorator_1.Permissions)('accounting.journal_entries.post'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], AccountingController.prototype, "postJournalEntry", null);
__decorate([
    (0, common_1.Patch)('journal-entries/:id/unpost'),
    (0, permissions_decorator_1.Permissions)('accounting.journal_entries.unpost'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], AccountingController.prototype, "unpostJournalEntry", null);
__decorate([
    (0, common_1.Post)('setup/system-accounts'),
    (0, permissions_decorator_1.Permissions)('accounting.setup'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AccountingController.prototype, "createDefaultSystemAccounts", null);
__decorate([
    (0, common_1.Get)('stats/overview'),
    (0, permissions_decorator_1.Permissions)('accounting.reports'),
    __param(0, (0, common_1.Query)('startDate')),
    __param(1, (0, common_1.Query)('endDate')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], AccountingController.prototype, "getAccountingStats", null);
__decorate([
    (0, common_1.Post)('auto/sales/:salesInvoiceId'),
    (0, permissions_decorator_1.Permissions)('accounting.auto_entries'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Param)('salesInvoiceId')),
    __param(1, (0, common_1.Body)('customerId')),
    __param(2, (0, common_1.Body)('totalAmount')),
    __param(3, (0, common_1.Body)('taxAmount')),
    __param(4, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Number, Number, Object]),
    __metadata("design:returntype", void 0)
], AccountingController.prototype, "createSalesJournalEntry", null);
__decorate([
    (0, common_1.Post)('auto/purchase/:purchaseInvoiceId'),
    (0, permissions_decorator_1.Permissions)('accounting.auto_entries'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Param)('purchaseInvoiceId')),
    __param(1, (0, common_1.Body)('supplierId')),
    __param(2, (0, common_1.Body)('totalAmount')),
    __param(3, (0, common_1.Body)('taxAmount')),
    __param(4, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Number, Number, Object]),
    __metadata("design:returntype", void 0)
], AccountingController.prototype, "createPurchaseJournalEntry", null);
__decorate([
    (0, common_1.Get)('reports/balance-sheet'),
    (0, permissions_decorator_1.Permissions)('accounting.reports'),
    __param(0, (0, common_1.Query)('asOfDate')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], AccountingController.prototype, "getBalanceSheetReport", null);
__decorate([
    (0, common_1.Get)('reports/profit-loss'),
    (0, permissions_decorator_1.Permissions)('accounting.reports'),
    __param(0, (0, common_1.Query)('startDate')),
    __param(1, (0, common_1.Query)('endDate')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], AccountingController.prototype, "getProfitLossReport", null);
__decorate([
    (0, common_1.Get)('reports/account-movement/:accountId'),
    (0, permissions_decorator_1.Permissions)('accounting.reports'),
    __param(0, (0, common_1.Param)('accountId')),
    __param(1, (0, common_1.Query)('startDate')),
    __param(2, (0, common_1.Query)('endDate')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", void 0)
], AccountingController.prototype, "getAccountMovementReport", null);
__decorate([
    (0, common_1.Get)('export/trial-balance'),
    (0, permissions_decorator_1.Permissions)('accounting.export'),
    __param(0, (0, common_1.Query)('asOfDate')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], AccountingController.prototype, "exportTrialBalance", null);
__decorate([
    (0, common_1.Get)('export/journal-entries'),
    (0, permissions_decorator_1.Permissions)('accounting.export'),
    __param(0, (0, common_1.Query)('startDate')),
    __param(1, (0, common_1.Query)('endDate')),
    __param(2, (0, common_1.Query)('format')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", void 0)
], AccountingController.prototype, "exportJournalEntries", null);
exports.AccountingController = AccountingController = __decorate([
    (0, common_1.Controller)('accounting'),
    __metadata("design:paramtypes", [accounting_service_1.AccountingService])
], AccountingController);
//# sourceMappingURL=accounting.controller.js.map