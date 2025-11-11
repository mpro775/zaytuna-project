"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AUDIT_LOG = void 0;
exports.AuditLog = AuditLog;
exports.AuditCreate = AuditCreate;
exports.AuditRead = AuditRead;
exports.AuditUpdate = AuditUpdate;
exports.AuditDelete = AuditDelete;
exports.AuditSecurity = AuditSecurity;
exports.AuditAuth = AuditAuth;
exports.AuditSystem = AuditSystem;
exports.AuditSales = AuditSales;
exports.AuditInventory = AuditInventory;
exports.AuditAccounting = AuditAccounting;
exports.AuditCustomer = AuditCustomer;
exports.AuditPurchasing = AuditPurchasing;
exports.AuditReporting = AuditReporting;
exports.AuditAdmin = AuditAdmin;
exports.getNestedValue = getNestedValue;
exports.sanitizeObject = sanitizeObject;
exports.createSearchableText = createSearchableText;
const common_1 = require("@nestjs/common");
exports.AUDIT_LOG = Symbol('AUDIT_LOG');
function AuditLog(options) {
    return function (target, propertyKey, descriptor) {
        (0, common_1.SetMetadata)(exports.AUDIT_LOG, options)(target, propertyKey, descriptor);
    };
}
function AuditCreate(options = {}) {
    return AuditLog({
        action: 'CREATE',
        logOnSuccess: true,
        logOnError: true,
        severity: 'info',
        category: 'business',
        ...options,
    });
}
function AuditRead(options = {}) {
    return AuditLog({
        action: 'READ',
        logOnSuccess: true,
        severity: 'info',
        category: 'business',
        ...options,
    });
}
function AuditUpdate(options = {}) {
    return AuditLog({
        action: 'UPDATE',
        logOnSuccess: true,
        logOnError: true,
        severity: 'info',
        category: 'business',
        includeRequestBody: true,
        ...options,
    });
}
function AuditDelete(options = {}) {
    return AuditLog({
        action: 'DELETE',
        logOnSuccess: true,
        logOnError: true,
        severity: 'warning',
        category: 'business',
        ...options,
    });
}
function AuditSecurity(options = {}) {
    return AuditLog({
        category: 'security',
        severity: 'warning',
        logOnSuccess: true,
        logOnError: true,
        ...options,
    });
}
function AuditAuth(options = {}) {
    return AuditLog({
        category: 'security',
        module: 'auth',
        logOnSuccess: true,
        logOnError: true,
        ...options,
    });
}
function AuditSystem(options = {}) {
    return AuditLog({
        category: 'system',
        logOnSuccess: true,
        logOnError: true,
        ...options,
    });
}
function AuditSales(options = {}) {
    return AuditLog({
        module: 'sales',
        category: 'business',
        ...options,
    });
}
function AuditInventory(options = {}) {
    return AuditLog({
        module: 'inventory',
        category: 'business',
        ...options,
    });
}
function AuditAccounting(options = {}) {
    return AuditLog({
        module: 'accounting',
        category: 'business',
        ...options,
    });
}
function AuditCustomer(options = {}) {
    return AuditLog({
        module: 'customer',
        category: 'business',
        ...options,
    });
}
function AuditPurchasing(options = {}) {
    return AuditLog({
        module: 'purchasing',
        category: 'business',
        ...options,
    });
}
function AuditReporting(options = {}) {
    return AuditLog({
        module: 'reporting',
        category: 'business',
        ...options,
    });
}
function AuditAdmin(options = {}) {
    return AuditLog({
        category: 'security',
        severity: 'warning',
        logOnSuccess: true,
        logOnError: true,
        ...options,
    });
}
function getNestedValue(obj, path) {
    return path.split('.').reduce((current, key) => current?.[key], obj);
}
function sanitizeObject(obj, excludeFields = []) {
    if (!obj || typeof obj !== 'object')
        return obj;
    const sanitized = { ...obj };
    const defaultSensitiveFields = ['password', 'passwordHash', 'token', 'secret', 'key'];
    const allExcludeFields = [...defaultSensitiveFields, ...excludeFields];
    allExcludeFields.forEach(field => {
        if (sanitized[field] !== undefined) {
            sanitized[field] = '[REDACTED]';
        }
    });
    return sanitized;
}
function createSearchableText(obj) {
    if (!obj)
        return '';
    const flatten = (o, prefix = '') => {
        const result = [];
        for (const [key, value] of Object.entries(o)) {
            const newKey = prefix ? `${prefix}.${key}` : key;
            if (value && typeof value === 'object' && !Array.isArray(value)) {
                result.push(...flatten(value, newKey));
            }
            else if (typeof value === 'string' || typeof value === 'number') {
                result.push(String(value));
            }
        }
        return result;
    };
    return flatten(obj).join(' ').toLowerCase();
}
//# sourceMappingURL=audit.decorators.js.map