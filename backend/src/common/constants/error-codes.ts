// رموز الأخطاء الموحدة للتطبيق

export enum ErrorCode {
  // أخطاء المصادقة (4000-4099)
  AUTHENTICATION_ERROR = 'AUTHENTICATION_ERROR',
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  TOKEN_INVALID = 'TOKEN_INVALID',
  REFRESH_TOKEN_EXPIRED = 'REFRESH_TOKEN_EXPIRED',
  TWO_FACTOR_REQUIRED = 'TWO_FACTOR_REQUIRED',
  TWO_FACTOR_INVALID = 'TWO_FACTOR_INVALID',

  // أخطاء الصلاحيات (4100-4199)
  AUTHORIZATION_ERROR = 'AUTHORIZATION_ERROR',
  INSUFFICIENT_PERMISSIONS = 'INSUFFICIENT_PERMISSIONS',
  ACCESS_DENIED = 'ACCESS_DENIED',
  ROLE_NOT_FOUND = 'ROLE_NOT_FOUND',
  PERMISSION_DENIED = 'PERMISSION_DENIED',

  // أخطاء التحقق من البيانات (4200-4299)
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  REQUIRED_FIELD = 'REQUIRED_FIELD',
  INVALID_FORMAT = 'INVALID_FORMAT',
  INVALID_LENGTH = 'INVALID_LENGTH',
  INVALID_RANGE = 'INVALID_RANGE',
  DUPLICATE_VALUE = 'DUPLICATE_VALUE',

  // أخطاء العثور على البيانات (4300-4399)
  NOT_FOUND_ERROR = 'NOT_FOUND_ERROR',
  USER_NOT_FOUND = 'USER_NOT_FOUND',
  PRODUCT_NOT_FOUND = 'PRODUCT_NOT_FOUND',
  INVOICE_NOT_FOUND = 'INVOICE_NOT_FOUND',
  BRANCH_NOT_FOUND = 'BRANCH_NOT_FOUND',
  WAREHOUSE_NOT_FOUND = 'WAREHOUSE_NOT_FOUND',

  // أخطاء الأعمال (4400-4499)
  BUSINESS_ERROR = 'BUSINESS_ERROR',
  INSUFFICIENT_STOCK = 'INSUFFICIENT_STOCK',
  INVALID_OPERATION = 'INVALID_OPERATION',
  CONFLICT_ERROR = 'CONFLICT_ERROR',
  RESOURCE_LOCKED = 'RESOURCE_LOCKED',
  OPERATION_NOT_ALLOWED = 'OPERATION_NOT_ALLOWED',

  // أخطاء النظام (4500-4599)
  SYSTEM_ERROR = 'SYSTEM_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
  CACHE_ERROR = 'CACHE_ERROR',
  FILE_SYSTEM_ERROR = 'FILE_SYSTEM_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  CONFIGURATION_ERROR = 'CONFIGURATION_ERROR',

  // أخطاء الخدمات الخارجية (4600-4699)
  EXTERNAL_ERROR = 'EXTERNAL_ERROR',
  PAYMENT_GATEWAY_ERROR = 'PAYMENT_GATEWAY_ERROR',
  SMS_SERVICE_ERROR = 'SMS_SERVICE_ERROR',
  EMAIL_SERVICE_ERROR = 'EMAIL_SERVICE_ERROR',
  THIRD_PARTY_ERROR = 'THIRD_PARTY_ERROR',

  // أخطاء الحد من المعدل (4700-4799)
  RATE_LIMIT_ERROR = 'RATE_LIMIT_ERROR',
  TOO_MANY_REQUESTS = 'TOO_MANY_REQUESTS',
  QUOTA_EXCEEDED = 'QUOTA_EXCEEDED',

  // أخطاء الخدمة غير المتاحة (4800-4899)
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  MAINTENANCE_MODE = 'MAINTENANCE_MODE',
  DATABASE_UNAVAILABLE = 'DATABASE_UNAVAILABLE',
  CACHE_UNAVAILABLE = 'CACHE_UNAVAILABLE',
}

// رسائل الأخطاء باللغة العربية
export const ErrorMessages: Record<ErrorCode, string> = {
  // أخطاء المصادقة
  [ErrorCode.AUTHENTICATION_ERROR]: 'خطأ في المصادقة',
  [ErrorCode.INVALID_CREDENTIALS]: 'بيانات الدخول غير صحيحة',
  [ErrorCode.TOKEN_EXPIRED]: 'انتهت صلاحية الرمز المميز',
  [ErrorCode.TOKEN_INVALID]: 'الرمز المميز غير صحيح',
  [ErrorCode.REFRESH_TOKEN_EXPIRED]: 'انتهت صلاحية رمز التحديث',
  [ErrorCode.TWO_FACTOR_REQUIRED]: 'مطلوب التحقق بخطوتين',
  [ErrorCode.TWO_FACTOR_INVALID]: 'رمز التحقق بخطوتين غير صحيح',

  // أخطاء الصلاحيات
  [ErrorCode.AUTHORIZATION_ERROR]: 'خطأ في الصلاحيات',
  [ErrorCode.INSUFFICIENT_PERMISSIONS]: 'صلاحيات غير كافية',
  [ErrorCode.ACCESS_DENIED]: 'تم رفض الوصول',
  [ErrorCode.ROLE_NOT_FOUND]: 'الدور غير موجود',
  [ErrorCode.PERMISSION_DENIED]: 'تم رفض الإذن',

  // أخطاء التحقق من البيانات
  [ErrorCode.VALIDATION_ERROR]: 'خطأ في التحقق من البيانات',
  [ErrorCode.REQUIRED_FIELD]: 'الحقل مطلوب',
  [ErrorCode.INVALID_FORMAT]: 'تنسيق غير صحيح',
  [ErrorCode.INVALID_LENGTH]: 'طول غير صحيح',
  [ErrorCode.INVALID_RANGE]: 'قيمة خارج النطاق المسموح',
  [ErrorCode.DUPLICATE_VALUE]: 'القيمة مكررة',

  // أخطاء العثور على البيانات
  [ErrorCode.NOT_FOUND_ERROR]: 'العنصر غير موجود',
  [ErrorCode.USER_NOT_FOUND]: 'المستخدم غير موجود',
  [ErrorCode.PRODUCT_NOT_FOUND]: 'المنتج غير موجود',
  [ErrorCode.INVOICE_NOT_FOUND]: 'الفاتورة غير موجودة',
  [ErrorCode.BRANCH_NOT_FOUND]: 'الفرع غير موجود',
  [ErrorCode.WAREHOUSE_NOT_FOUND]: 'المخزن غير موجود',

  // أخطاء الأعمال
  [ErrorCode.BUSINESS_ERROR]: 'خطأ في منطق الأعمال',
  [ErrorCode.INSUFFICIENT_STOCK]: 'الكمية المتاحة غير كافية',
  [ErrorCode.INVALID_OPERATION]: 'العملية غير صحيحة',
  [ErrorCode.CONFLICT_ERROR]: 'تعارض في البيانات',
  [ErrorCode.RESOURCE_LOCKED]: 'المورد مقفل',
  [ErrorCode.OPERATION_NOT_ALLOWED]: 'العملية غير مسموحة',

  // أخطاء النظام
  [ErrorCode.SYSTEM_ERROR]: 'خطأ في النظام',
  [ErrorCode.DATABASE_ERROR]: 'خطأ في قاعدة البيانات',
  [ErrorCode.CACHE_ERROR]: 'خطأ في نظام الكاش',
  [ErrorCode.FILE_SYSTEM_ERROR]: 'خطأ في نظام الملفات',
  [ErrorCode.NETWORK_ERROR]: 'خطأ في الشبكة',
  [ErrorCode.CONFIGURATION_ERROR]: 'خطأ في التكوين',

  // أخطاء الخدمات الخارجية
  [ErrorCode.EXTERNAL_ERROR]: 'خطأ في الخدمة الخارجية',
  [ErrorCode.PAYMENT_GATEWAY_ERROR]: 'خطأ في بوابة الدفع',
  [ErrorCode.SMS_SERVICE_ERROR]: 'خطأ في خدمة الرسائل النصية',
  [ErrorCode.EMAIL_SERVICE_ERROR]: 'خطأ في خدمة البريد الإلكتروني',
  [ErrorCode.THIRD_PARTY_ERROR]: 'خطأ في خدمة خارجية',

  // أخطاء الحد من المعدل
  [ErrorCode.RATE_LIMIT_ERROR]: 'تم تجاوز الحد المسموح للطلبات',
  [ErrorCode.TOO_MANY_REQUESTS]: 'عدد كبير جداً من الطلبات',
  [ErrorCode.QUOTA_EXCEEDED]: 'تم تجاوز الحصة المسموحة',

  // أخطاء الخدمة غير المتاحة
  [ErrorCode.SERVICE_UNAVAILABLE]: 'الخدمة غير متاحة',
  [ErrorCode.MAINTENANCE_MODE]: 'وضع الصيانة',
  [ErrorCode.DATABASE_UNAVAILABLE]: 'قاعدة البيانات غير متاحة',
  [ErrorCode.CACHE_UNAVAILABLE]: 'نظام الكاش غير متاح',
};

// رموز الحالة HTTP المقترنة بكل خطأ
export const ErrorStatusCodes: Record<ErrorCode, number> = {
  // أخطاء المصادقة
  [ErrorCode.AUTHENTICATION_ERROR]: 401,
  [ErrorCode.INVALID_CREDENTIALS]: 401,
  [ErrorCode.TOKEN_EXPIRED]: 401,
  [ErrorCode.TOKEN_INVALID]: 401,
  [ErrorCode.REFRESH_TOKEN_EXPIRED]: 401,
  [ErrorCode.TWO_FACTOR_REQUIRED]: 401,
  [ErrorCode.TWO_FACTOR_INVALID]: 401,

  // أخطاء الصلاحيات
  [ErrorCode.AUTHORIZATION_ERROR]: 403,
  [ErrorCode.INSUFFICIENT_PERMISSIONS]: 403,
  [ErrorCode.ACCESS_DENIED]: 403,
  [ErrorCode.ROLE_NOT_FOUND]: 404,
  [ErrorCode.PERMISSION_DENIED]: 403,

  // أخطاء التحقق من البيانات
  [ErrorCode.VALIDATION_ERROR]: 400,
  [ErrorCode.REQUIRED_FIELD]: 400,
  [ErrorCode.INVALID_FORMAT]: 400,
  [ErrorCode.INVALID_LENGTH]: 400,
  [ErrorCode.INVALID_RANGE]: 400,
  [ErrorCode.DUPLICATE_VALUE]: 409,

  // أخطاء العثور على البيانات
  [ErrorCode.NOT_FOUND_ERROR]: 404,
  [ErrorCode.USER_NOT_FOUND]: 404,
  [ErrorCode.PRODUCT_NOT_FOUND]: 404,
  [ErrorCode.INVOICE_NOT_FOUND]: 404,
  [ErrorCode.BRANCH_NOT_FOUND]: 404,
  [ErrorCode.WAREHOUSE_NOT_FOUND]: 404,

  // أخطاء الأعمال
  [ErrorCode.BUSINESS_ERROR]: 422,
  [ErrorCode.INSUFFICIENT_STOCK]: 422,
  [ErrorCode.INVALID_OPERATION]: 422,
  [ErrorCode.CONFLICT_ERROR]: 409,
  [ErrorCode.RESOURCE_LOCKED]: 423,
  [ErrorCode.OPERATION_NOT_ALLOWED]: 422,

  // أخطاء النظام
  [ErrorCode.SYSTEM_ERROR]: 500,
  [ErrorCode.DATABASE_ERROR]: 500,
  [ErrorCode.CACHE_ERROR]: 500,
  [ErrorCode.FILE_SYSTEM_ERROR]: 500,
  [ErrorCode.NETWORK_ERROR]: 500,
  [ErrorCode.CONFIGURATION_ERROR]: 500,

  // أخطاء الخدمات الخارجية
  [ErrorCode.EXTERNAL_ERROR]: 502,
  [ErrorCode.PAYMENT_GATEWAY_ERROR]: 502,
  [ErrorCode.SMS_SERVICE_ERROR]: 502,
  [ErrorCode.EMAIL_SERVICE_ERROR]: 502,
  [ErrorCode.THIRD_PARTY_ERROR]: 502,

  // أخطاء الحد من المعدل
  [ErrorCode.RATE_LIMIT_ERROR]: 429,
  [ErrorCode.TOO_MANY_REQUESTS]: 429,
  [ErrorCode.QUOTA_EXCEEDED]: 429,

  // أخطاء الخدمة غير المتاحة
  [ErrorCode.SERVICE_UNAVAILABLE]: 503,
  [ErrorCode.MAINTENANCE_MODE]: 503,
  [ErrorCode.DATABASE_UNAVAILABLE]: 503,
  [ErrorCode.CACHE_UNAVAILABLE]: 503,
};
