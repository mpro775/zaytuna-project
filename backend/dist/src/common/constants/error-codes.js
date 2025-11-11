"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ErrorStatusCodes = exports.ErrorMessages = exports.ErrorCode = void 0;
var ErrorCode;
(function (ErrorCode) {
    ErrorCode["AUTHENTICATION_ERROR"] = "AUTHENTICATION_ERROR";
    ErrorCode["INVALID_CREDENTIALS"] = "INVALID_CREDENTIALS";
    ErrorCode["TOKEN_EXPIRED"] = "TOKEN_EXPIRED";
    ErrorCode["TOKEN_INVALID"] = "TOKEN_INVALID";
    ErrorCode["REFRESH_TOKEN_EXPIRED"] = "REFRESH_TOKEN_EXPIRED";
    ErrorCode["TWO_FACTOR_REQUIRED"] = "TWO_FACTOR_REQUIRED";
    ErrorCode["TWO_FACTOR_INVALID"] = "TWO_FACTOR_INVALID";
    ErrorCode["AUTHORIZATION_ERROR"] = "AUTHORIZATION_ERROR";
    ErrorCode["INSUFFICIENT_PERMISSIONS"] = "INSUFFICIENT_PERMISSIONS";
    ErrorCode["ACCESS_DENIED"] = "ACCESS_DENIED";
    ErrorCode["ROLE_NOT_FOUND"] = "ROLE_NOT_FOUND";
    ErrorCode["PERMISSION_DENIED"] = "PERMISSION_DENIED";
    ErrorCode["VALIDATION_ERROR"] = "VALIDATION_ERROR";
    ErrorCode["REQUIRED_FIELD"] = "REQUIRED_FIELD";
    ErrorCode["INVALID_FORMAT"] = "INVALID_FORMAT";
    ErrorCode["INVALID_LENGTH"] = "INVALID_LENGTH";
    ErrorCode["INVALID_RANGE"] = "INVALID_RANGE";
    ErrorCode["DUPLICATE_VALUE"] = "DUPLICATE_VALUE";
    ErrorCode["NOT_FOUND_ERROR"] = "NOT_FOUND_ERROR";
    ErrorCode["USER_NOT_FOUND"] = "USER_NOT_FOUND";
    ErrorCode["PRODUCT_NOT_FOUND"] = "PRODUCT_NOT_FOUND";
    ErrorCode["INVOICE_NOT_FOUND"] = "INVOICE_NOT_FOUND";
    ErrorCode["BRANCH_NOT_FOUND"] = "BRANCH_NOT_FOUND";
    ErrorCode["WAREHOUSE_NOT_FOUND"] = "WAREHOUSE_NOT_FOUND";
    ErrorCode["BUSINESS_ERROR"] = "BUSINESS_ERROR";
    ErrorCode["INSUFFICIENT_STOCK"] = "INSUFFICIENT_STOCK";
    ErrorCode["INVALID_OPERATION"] = "INVALID_OPERATION";
    ErrorCode["CONFLICT_ERROR"] = "CONFLICT_ERROR";
    ErrorCode["RESOURCE_LOCKED"] = "RESOURCE_LOCKED";
    ErrorCode["OPERATION_NOT_ALLOWED"] = "OPERATION_NOT_ALLOWED";
    ErrorCode["SYSTEM_ERROR"] = "SYSTEM_ERROR";
    ErrorCode["DATABASE_ERROR"] = "DATABASE_ERROR";
    ErrorCode["CACHE_ERROR"] = "CACHE_ERROR";
    ErrorCode["FILE_SYSTEM_ERROR"] = "FILE_SYSTEM_ERROR";
    ErrorCode["NETWORK_ERROR"] = "NETWORK_ERROR";
    ErrorCode["CONFIGURATION_ERROR"] = "CONFIGURATION_ERROR";
    ErrorCode["EXTERNAL_ERROR"] = "EXTERNAL_ERROR";
    ErrorCode["PAYMENT_GATEWAY_ERROR"] = "PAYMENT_GATEWAY_ERROR";
    ErrorCode["SMS_SERVICE_ERROR"] = "SMS_SERVICE_ERROR";
    ErrorCode["EMAIL_SERVICE_ERROR"] = "EMAIL_SERVICE_ERROR";
    ErrorCode["THIRD_PARTY_ERROR"] = "THIRD_PARTY_ERROR";
    ErrorCode["RATE_LIMIT_ERROR"] = "RATE_LIMIT_ERROR";
    ErrorCode["TOO_MANY_REQUESTS"] = "TOO_MANY_REQUESTS";
    ErrorCode["QUOTA_EXCEEDED"] = "QUOTA_EXCEEDED";
    ErrorCode["SERVICE_UNAVAILABLE"] = "SERVICE_UNAVAILABLE";
    ErrorCode["MAINTENANCE_MODE"] = "MAINTENANCE_MODE";
    ErrorCode["DATABASE_UNAVAILABLE"] = "DATABASE_UNAVAILABLE";
    ErrorCode["CACHE_UNAVAILABLE"] = "CACHE_UNAVAILABLE";
})(ErrorCode || (exports.ErrorCode = ErrorCode = {}));
exports.ErrorMessages = {
    [ErrorCode.AUTHENTICATION_ERROR]: 'خطأ في المصادقة',
    [ErrorCode.INVALID_CREDENTIALS]: 'بيانات الدخول غير صحيحة',
    [ErrorCode.TOKEN_EXPIRED]: 'انتهت صلاحية الرمز المميز',
    [ErrorCode.TOKEN_INVALID]: 'الرمز المميز غير صحيح',
    [ErrorCode.REFRESH_TOKEN_EXPIRED]: 'انتهت صلاحية رمز التحديث',
    [ErrorCode.TWO_FACTOR_REQUIRED]: 'مطلوب التحقق بخطوتين',
    [ErrorCode.TWO_FACTOR_INVALID]: 'رمز التحقق بخطوتين غير صحيح',
    [ErrorCode.AUTHORIZATION_ERROR]: 'خطأ في الصلاحيات',
    [ErrorCode.INSUFFICIENT_PERMISSIONS]: 'صلاحيات غير كافية',
    [ErrorCode.ACCESS_DENIED]: 'تم رفض الوصول',
    [ErrorCode.ROLE_NOT_FOUND]: 'الدور غير موجود',
    [ErrorCode.PERMISSION_DENIED]: 'تم رفض الإذن',
    [ErrorCode.VALIDATION_ERROR]: 'خطأ في التحقق من البيانات',
    [ErrorCode.REQUIRED_FIELD]: 'الحقل مطلوب',
    [ErrorCode.INVALID_FORMAT]: 'تنسيق غير صحيح',
    [ErrorCode.INVALID_LENGTH]: 'طول غير صحيح',
    [ErrorCode.INVALID_RANGE]: 'قيمة خارج النطاق المسموح',
    [ErrorCode.DUPLICATE_VALUE]: 'القيمة مكررة',
    [ErrorCode.NOT_FOUND_ERROR]: 'العنصر غير موجود',
    [ErrorCode.USER_NOT_FOUND]: 'المستخدم غير موجود',
    [ErrorCode.PRODUCT_NOT_FOUND]: 'المنتج غير موجود',
    [ErrorCode.INVOICE_NOT_FOUND]: 'الفاتورة غير موجودة',
    [ErrorCode.BRANCH_NOT_FOUND]: 'الفرع غير موجود',
    [ErrorCode.WAREHOUSE_NOT_FOUND]: 'المخزن غير موجود',
    [ErrorCode.BUSINESS_ERROR]: 'خطأ في منطق الأعمال',
    [ErrorCode.INSUFFICIENT_STOCK]: 'الكمية المتاحة غير كافية',
    [ErrorCode.INVALID_OPERATION]: 'العملية غير صحيحة',
    [ErrorCode.CONFLICT_ERROR]: 'تعارض في البيانات',
    [ErrorCode.RESOURCE_LOCKED]: 'المورد مقفل',
    [ErrorCode.OPERATION_NOT_ALLOWED]: 'العملية غير مسموحة',
    [ErrorCode.SYSTEM_ERROR]: 'خطأ في النظام',
    [ErrorCode.DATABASE_ERROR]: 'خطأ في قاعدة البيانات',
    [ErrorCode.CACHE_ERROR]: 'خطأ في نظام الكاش',
    [ErrorCode.FILE_SYSTEM_ERROR]: 'خطأ في نظام الملفات',
    [ErrorCode.NETWORK_ERROR]: 'خطأ في الشبكة',
    [ErrorCode.CONFIGURATION_ERROR]: 'خطأ في التكوين',
    [ErrorCode.EXTERNAL_ERROR]: 'خطأ في الخدمة الخارجية',
    [ErrorCode.PAYMENT_GATEWAY_ERROR]: 'خطأ في بوابة الدفع',
    [ErrorCode.SMS_SERVICE_ERROR]: 'خطأ في خدمة الرسائل النصية',
    [ErrorCode.EMAIL_SERVICE_ERROR]: 'خطأ في خدمة البريد الإلكتروني',
    [ErrorCode.THIRD_PARTY_ERROR]: 'خطأ في خدمة خارجية',
    [ErrorCode.RATE_LIMIT_ERROR]: 'تم تجاوز الحد المسموح للطلبات',
    [ErrorCode.TOO_MANY_REQUESTS]: 'عدد كبير جداً من الطلبات',
    [ErrorCode.QUOTA_EXCEEDED]: 'تم تجاوز الحصة المسموحة',
    [ErrorCode.SERVICE_UNAVAILABLE]: 'الخدمة غير متاحة',
    [ErrorCode.MAINTENANCE_MODE]: 'وضع الصيانة',
    [ErrorCode.DATABASE_UNAVAILABLE]: 'قاعدة البيانات غير متاحة',
    [ErrorCode.CACHE_UNAVAILABLE]: 'نظام الكاش غير متاح',
};
exports.ErrorStatusCodes = {
    [ErrorCode.AUTHENTICATION_ERROR]: 401,
    [ErrorCode.INVALID_CREDENTIALS]: 401,
    [ErrorCode.TOKEN_EXPIRED]: 401,
    [ErrorCode.TOKEN_INVALID]: 401,
    [ErrorCode.REFRESH_TOKEN_EXPIRED]: 401,
    [ErrorCode.TWO_FACTOR_REQUIRED]: 401,
    [ErrorCode.TWO_FACTOR_INVALID]: 401,
    [ErrorCode.AUTHORIZATION_ERROR]: 403,
    [ErrorCode.INSUFFICIENT_PERMISSIONS]: 403,
    [ErrorCode.ACCESS_DENIED]: 403,
    [ErrorCode.ROLE_NOT_FOUND]: 404,
    [ErrorCode.PERMISSION_DENIED]: 403,
    [ErrorCode.VALIDATION_ERROR]: 400,
    [ErrorCode.REQUIRED_FIELD]: 400,
    [ErrorCode.INVALID_FORMAT]: 400,
    [ErrorCode.INVALID_LENGTH]: 400,
    [ErrorCode.INVALID_RANGE]: 400,
    [ErrorCode.DUPLICATE_VALUE]: 409,
    [ErrorCode.NOT_FOUND_ERROR]: 404,
    [ErrorCode.USER_NOT_FOUND]: 404,
    [ErrorCode.PRODUCT_NOT_FOUND]: 404,
    [ErrorCode.INVOICE_NOT_FOUND]: 404,
    [ErrorCode.BRANCH_NOT_FOUND]: 404,
    [ErrorCode.WAREHOUSE_NOT_FOUND]: 404,
    [ErrorCode.BUSINESS_ERROR]: 422,
    [ErrorCode.INSUFFICIENT_STOCK]: 422,
    [ErrorCode.INVALID_OPERATION]: 422,
    [ErrorCode.CONFLICT_ERROR]: 409,
    [ErrorCode.RESOURCE_LOCKED]: 423,
    [ErrorCode.OPERATION_NOT_ALLOWED]: 422,
    [ErrorCode.SYSTEM_ERROR]: 500,
    [ErrorCode.DATABASE_ERROR]: 500,
    [ErrorCode.CACHE_ERROR]: 500,
    [ErrorCode.FILE_SYSTEM_ERROR]: 500,
    [ErrorCode.NETWORK_ERROR]: 500,
    [ErrorCode.CONFIGURATION_ERROR]: 500,
    [ErrorCode.EXTERNAL_ERROR]: 502,
    [ErrorCode.PAYMENT_GATEWAY_ERROR]: 502,
    [ErrorCode.SMS_SERVICE_ERROR]: 502,
    [ErrorCode.EMAIL_SERVICE_ERROR]: 502,
    [ErrorCode.THIRD_PARTY_ERROR]: 502,
    [ErrorCode.RATE_LIMIT_ERROR]: 429,
    [ErrorCode.TOO_MANY_REQUESTS]: 429,
    [ErrorCode.QUOTA_EXCEEDED]: 429,
    [ErrorCode.SERVICE_UNAVAILABLE]: 503,
    [ErrorCode.MAINTENANCE_MODE]: 503,
    [ErrorCode.DATABASE_UNAVAILABLE]: 503,
    [ErrorCode.CACHE_UNAVAILABLE]: 503,
};
//# sourceMappingURL=error-codes.js.map