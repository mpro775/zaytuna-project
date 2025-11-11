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
exports.CustomerController = void 0;
const common_1 = require("@nestjs/common");
const customer_service_1 = require("./customer.service");
const create_customer_dto_1 = require("./dto/create-customer.dto");
const update_customer_dto_1 = require("./dto/update-customer.dto");
const permissions_decorator_1 = require("../../common/decorators/permissions.decorator");
let CustomerController = class CustomerController {
    customerService;
    constructor(customerService) {
        this.customerService = customerService;
    }
    create(createCustomerDto) {
        return this.customerService.create(createCustomerDto);
    }
    findAll(search, isActive, loyaltyTier, limit) {
        const active = isActive === 'true' ? true : isActive === 'false' ? false : undefined;
        return this.customerService.findAll(search, active, loyaltyTier, limit ? parseInt(limit.toString()) : 50);
    }
    searchCustomers(query, loyaltyTier, minPurchases, maxPurchases, hasMarketingConsent, gender, limit) {
        const filters = {
            loyaltyTier,
            minPurchases: minPurchases ? parseFloat(minPurchases.toString()) : undefined,
            maxPurchases: maxPurchases ? parseFloat(maxPurchases.toString()) : undefined,
            hasMarketingConsent: hasMarketingConsent === 'true' ? true : hasMarketingConsent === 'false' ? false : undefined,
            gender,
        };
        return this.customerService.searchCustomers(query, filters, limit ? parseInt(limit.toString()) : 50);
    }
    findOne(id) {
        return this.customerService.findOne(id);
    }
    update(id, updateCustomerDto) {
        return this.customerService.update(id, updateCustomerDto);
    }
    remove(id) {
        return this.customerService.remove(id);
    }
    getLoyaltyStats(id) {
        return this.customerService.getLoyaltyStats(id);
    }
    updateLoyaltyPoints(id, pointsChange, reason) {
        return this.customerService.updateLoyaltyPoints(id, pointsChange, reason);
    }
    getCustomerStats(startDate, endDate) {
        const start = startDate ? new Date(startDate) : undefined;
        const end = endDate ? new Date(endDate) : undefined;
        return this.customerService.getCustomerStats(start, end);
    }
    getTopCustomers(limit) {
        return { message: 'سيتم إضافة هذه الوظيفة قريباً' };
    }
    exportCustomers(filters) {
        return { message: 'سيتم إضافة هذه الوظيفة قريباً' };
    }
    sendMarketingMessage(customerIds, message, subject) {
        return { message: 'سيتم إضافة هذه الوظيفة قريباً' };
    }
};
exports.CustomerController = CustomerController;
__decorate([
    (0, common_1.Post)(),
    (0, permissions_decorator_1.Permissions)('customers.create'),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_customer_dto_1.CreateCustomerDto]),
    __metadata("design:returntype", void 0)
], CustomerController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, permissions_decorator_1.Permissions)('customers.read'),
    __param(0, (0, common_1.Query)('search')),
    __param(1, (0, common_1.Query)('isActive')),
    __param(2, (0, common_1.Query)('loyaltyTier')),
    __param(3, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, Number]),
    __metadata("design:returntype", void 0)
], CustomerController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('search'),
    (0, permissions_decorator_1.Permissions)('customers.read'),
    __param(0, (0, common_1.Query)('query')),
    __param(1, (0, common_1.Query)('loyaltyTier')),
    __param(2, (0, common_1.Query)('minPurchases')),
    __param(3, (0, common_1.Query)('maxPurchases')),
    __param(4, (0, common_1.Query)('hasMarketingConsent')),
    __param(5, (0, common_1.Query)('gender')),
    __param(6, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Number, Number, String, String, Number]),
    __metadata("design:returntype", void 0)
], CustomerController.prototype, "searchCustomers", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, permissions_decorator_1.Permissions)('customers.read'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], CustomerController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, permissions_decorator_1.Permissions)('customers.update'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_customer_dto_1.UpdateCustomerDto]),
    __metadata("design:returntype", void 0)
], CustomerController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, permissions_decorator_1.Permissions)('customers.delete'),
    (0, common_1.HttpCode)(common_1.HttpStatus.NO_CONTENT),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], CustomerController.prototype, "remove", null);
__decorate([
    (0, common_1.Get)(':id/loyalty'),
    (0, permissions_decorator_1.Permissions)('customers.read'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], CustomerController.prototype, "getLoyaltyStats", null);
__decorate([
    (0, common_1.Patch)(':id/loyalty-points'),
    (0, permissions_decorator_1.Permissions)('customers.update'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)('pointsChange')),
    __param(2, (0, common_1.Body)('reason')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Number, String]),
    __metadata("design:returntype", void 0)
], CustomerController.prototype, "updateLoyaltyPoints", null);
__decorate([
    (0, common_1.Get)('stats/overview'),
    (0, permissions_decorator_1.Permissions)('customers.reports'),
    __param(0, (0, common_1.Query)('startDate')),
    __param(1, (0, common_1.Query)('endDate')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], CustomerController.prototype, "getCustomerStats", null);
__decorate([
    (0, common_1.Get)('stats/top-customers'),
    (0, permissions_decorator_1.Permissions)('customers.reports'),
    __param(0, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], CustomerController.prototype, "getTopCustomers", null);
__decorate([
    (0, common_1.Get)('export/csv'),
    (0, permissions_decorator_1.Permissions)('customers.export'),
    __param(0, (0, common_1.Query)('filters')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], CustomerController.prototype, "exportCustomers", null);
__decorate([
    (0, common_1.Post)('marketing/send'),
    (0, permissions_decorator_1.Permissions)('customers.marketing'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Body)('customerIds')),
    __param(1, (0, common_1.Body)('message')),
    __param(2, (0, common_1.Body)('subject')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Array, String, String]),
    __metadata("design:returntype", void 0)
], CustomerController.prototype, "sendMarketingMessage", null);
exports.CustomerController = CustomerController = __decorate([
    (0, common_1.Controller)('customers'),
    __metadata("design:paramtypes", [customer_service_1.CustomerService])
], CustomerController);
//# sourceMappingURL=customer.controller.js.map