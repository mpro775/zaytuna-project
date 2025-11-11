"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdatePurchaseInvoiceDto = void 0;
const mapped_types_1 = require("@nestjs/mapped-types");
const create_purchase_invoice_dto_1 = require("./create-purchase-invoice.dto");
class UpdatePurchaseInvoiceDto extends (0, mapped_types_1.PartialType)(create_purchase_invoice_dto_1.CreatePurchaseInvoiceDto) {
    status;
    paymentStatus;
}
exports.UpdatePurchaseInvoiceDto = UpdatePurchaseInvoiceDto;
//# sourceMappingURL=update-purchase-invoice.dto.js.map