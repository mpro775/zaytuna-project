[dotenv@17.2.3] injecting env (0) from .env -- tip: ??  load multiple .env files with { path: ['.env.local', '.env'] }
-- CreateTable
CREATE TABLE "companies" (
    "id" VARCHAR(50) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "address" TEXT,
    "phone" VARCHAR(50),
    "email" VARCHAR(255),
    "taxNumber" VARCHAR(100),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "companies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "branches" (
    "id" VARCHAR(50) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "code" VARCHAR(50) NOT NULL,
    "address" TEXT,
    "phone" VARCHAR(50),
    "email" VARCHAR(255),
    "managerId" VARCHAR(50),
    "companyId" VARCHAR(50) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "branches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "warehouses" (
    "id" VARCHAR(50) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "code" VARCHAR(50) NOT NULL,
    "address" TEXT,
    "phone" VARCHAR(50),
    "email" VARCHAR(255),
    "managerId" VARCHAR(50),
    "branchId" VARCHAR(50) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "warehouses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "roles" (
    "id" VARCHAR(50) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "permissions" JSONB NOT NULL DEFAULT '[]',
    "isSystemRole" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" VARCHAR(50) NOT NULL,
    "username" VARCHAR(100) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "phone" VARCHAR(50),
    "passwordHash" VARCHAR(255) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastLoginAt" TIMESTAMP(3),
    "branchId" VARCHAR(50),
    "roleId" VARCHAR(50) NOT NULL,
    "twoFactorEnabled" BOOLEAN NOT NULL DEFAULT false,
    "twoFactorSecret" VARCHAR(255),
    "biometricEnabled" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categories" (
    "id" VARCHAR(50) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "parentId" VARCHAR(50),
    "imageUrl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "products" (
    "id" VARCHAR(50) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "barcode" VARCHAR(100),
    "sku" VARCHAR(100),
    "categoryId" VARCHAR(50) NOT NULL,
    "basePrice" DECIMAL(10,2) NOT NULL,
    "costPrice" DECIMAL(10,2),
    "taxId" VARCHAR(50),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "trackInventory" BOOLEAN NOT NULL DEFAULT true,
    "reorderPoint" INTEGER DEFAULT 0,
    "imageUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_variants" (
    "id" VARCHAR(50) NOT NULL,
    "productId" VARCHAR(50) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "sku" VARCHAR(100),
    "barcode" VARCHAR(100),
    "price" DECIMAL(10,2),
    "costPrice" DECIMAL(10,2),
    "weight" DECIMAL(8,3),
    "dimensions" JSONB,
    "attributes" JSONB,
    "imageUrl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "product_variants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stock_items" (
    "id" VARCHAR(50) NOT NULL,
    "warehouseId" VARCHAR(50) NOT NULL,
    "productVariantId" VARCHAR(50) NOT NULL,
    "quantity" DECIMAL(10,3) NOT NULL,
    "minStock" DECIMAL(10,3) NOT NULL DEFAULT 0,
    "maxStock" DECIMAL(10,3) NOT NULL DEFAULT 1000,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "stock_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stock_movements" (
    "id" VARCHAR(50) NOT NULL,
    "warehouseId" VARCHAR(50) NOT NULL,
    "productVariantId" VARCHAR(50) NOT NULL,
    "movementType" VARCHAR(50) NOT NULL,
    "quantity" DECIMAL(10,3) NOT NULL,
    "referenceType" VARCHAR(50),
    "referenceId" VARCHAR(50),
    "reason" TEXT,
    "performedBy" VARCHAR(50),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "stock_movements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customers" (
    "id" VARCHAR(50) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "phone" VARCHAR(50),
    "email" VARCHAR(255),
    "address" TEXT,
    "taxNumber" VARCHAR(100),
    "creditLimit" DECIMAL(10,2),
    "loyaltyPoints" INTEGER NOT NULL DEFAULT 0,
    "loyaltyTier" VARCHAR(20) NOT NULL DEFAULT 'bronze',
    "totalPurchases" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "lastPurchaseDate" TIMESTAMP(3),
    "preferredPaymentMethod" VARCHAR(50),
    "birthday" TIMESTAMP(3),
    "gender" VARCHAR(10),
    "marketingConsent" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "customers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "currencies" (
    "id" VARCHAR(50) NOT NULL,
    "code" VARCHAR(10) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "symbol" VARCHAR(10),
    "decimalPlaces" INTEGER NOT NULL DEFAULT 2,
    "exchangeRate" DECIMAL(18,8) NOT NULL DEFAULT 1,
    "isBase" BOOLEAN NOT NULL DEFAULT false,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "currencies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exchange_rates" (
    "id" VARCHAR(50) NOT NULL,
    "fromCurrencyId" VARCHAR(50) NOT NULL,
    "toCurrencyId" VARCHAR(50) NOT NULL,
    "rate" DECIMAL(18,8) NOT NULL,
    "effectiveAt" TIMESTAMP(3) NOT NULL,
    "source" VARCHAR(50),
    "notes" TEXT,
    "createdBy" VARCHAR(50),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "exchange_rates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "app_settings" (
    "id" VARCHAR(50) NOT NULL,
    "scope" VARCHAR(50) NOT NULL,
    "scopeId" VARCHAR(50),
    "key" VARCHAR(120) NOT NULL,
    "value" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "app_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "taxes" (
    "id" VARCHAR(50) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "rate" DECIMAL(5,2) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "taxes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sales_invoices" (
    "id" VARCHAR(50) NOT NULL,
    "invoiceNumber" VARCHAR(50) NOT NULL,
    "branchId" VARCHAR(50) NOT NULL,
    "customerId" VARCHAR(50),
    "cashierId" VARCHAR(50) NOT NULL,
    "warehouseId" VARCHAR(50) NOT NULL,
    "subtotal" DECIMAL(10,2) NOT NULL,
    "taxAmount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "discountAmount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "totalAmount" DECIMAL(10,2) NOT NULL,
    "currencyId" VARCHAR(50) NOT NULL,
    "exchangeRate" DECIMAL(18,8) NOT NULL DEFAULT 1,
    "baseCurrencyId" VARCHAR(50),
    "baseSubtotal" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "baseTaxAmount" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "baseDiscountAmount" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "baseTotalAmount" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "taxId" VARCHAR(50),
    "status" VARCHAR(50) NOT NULL DEFAULT 'draft',
    "paymentStatus" VARCHAR(50) NOT NULL DEFAULT 'pending',
    "notes" TEXT,
    "dueDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sales_invoices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sales_invoice_lines" (
    "id" VARCHAR(50) NOT NULL,
    "salesInvoiceId" VARCHAR(50) NOT NULL,
    "productVariantId" VARCHAR(50) NOT NULL,
    "warehouseId" VARCHAR(50) NOT NULL,
    "quantity" DECIMAL(10,3) NOT NULL,
    "unitPrice" DECIMAL(10,2) NOT NULL,
    "discountAmount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "taxAmount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "lineTotal" DECIMAL(10,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sales_invoice_lines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" VARCHAR(50) NOT NULL,
    "salesInvoiceId" VARCHAR(50),
    "customerId" VARCHAR(50),
    "currencyId" VARCHAR(50) NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "exchangeRate" DECIMAL(18,8) NOT NULL DEFAULT 1,
    "baseCurrencyId" VARCHAR(50),
    "baseAmount" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "paymentMethod" VARCHAR(50) NOT NULL,
    "referenceNumber" VARCHAR(100),
    "notes" TEXT,
    "paymentDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedBy" VARCHAR(50),

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "returns" (
    "id" VARCHAR(50) NOT NULL,
    "returnNumber" VARCHAR(50) NOT NULL,
    "salesInvoiceId" VARCHAR(50) NOT NULL,
    "customerId" VARCHAR(50),
    "cashierId" VARCHAR(50) NOT NULL,
    "warehouseId" VARCHAR(50) NOT NULL,
    "subtotal" DECIMAL(10,2) NOT NULL,
    "taxAmount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "discountAmount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "totalAmount" DECIMAL(10,2) NOT NULL,
    "currencyId" VARCHAR(50) NOT NULL,
    "reason" TEXT NOT NULL,
    "status" VARCHAR(50) NOT NULL DEFAULT 'draft',
    "refundStatus" VARCHAR(50) NOT NULL DEFAULT 'pending',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "returns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "return_lines" (
    "id" VARCHAR(50) NOT NULL,
    "returnId" VARCHAR(50) NOT NULL,
    "productVariantId" VARCHAR(50) NOT NULL,
    "warehouseId" VARCHAR(50) NOT NULL,
    "quantity" DECIMAL(10,3) NOT NULL,
    "unitPrice" DECIMAL(10,2) NOT NULL,
    "discountAmount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "taxAmount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "lineTotal" DECIMAL(10,2) NOT NULL,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "return_lines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "credit_notes" (
    "id" VARCHAR(50) NOT NULL,
    "creditNoteNumber" VARCHAR(50) NOT NULL,
    "returnId" VARCHAR(50) NOT NULL,
    "customerId" VARCHAR(50),
    "currencyId" VARCHAR(50) NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "remainingAmount" DECIMAL(10,2) NOT NULL,
    "status" VARCHAR(50) NOT NULL DEFAULT 'active',
    "expiryDate" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "credit_notes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "suppliers" (
    "id" VARCHAR(50) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "contactName" VARCHAR(255),
    "phone" VARCHAR(50),
    "email" VARCHAR(255),
    "address" TEXT,
    "taxNumber" VARCHAR(100),
    "paymentTerms" VARCHAR(255),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "suppliers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "purchase_orders" (
    "id" VARCHAR(50) NOT NULL,
    "orderNumber" VARCHAR(50) NOT NULL,
    "supplierId" VARCHAR(50) NOT NULL,
    "warehouseId" VARCHAR(50) NOT NULL,
    "requestedBy" VARCHAR(50) NOT NULL,
    "expectedDate" TIMESTAMP(3),
    "notes" TEXT,
    "status" VARCHAR(50) NOT NULL DEFAULT 'draft',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "purchase_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "purchase_order_lines" (
    "id" VARCHAR(50) NOT NULL,
    "purchaseOrderId" VARCHAR(50) NOT NULL,
    "productId" VARCHAR(50) NOT NULL,
    "quantity" DECIMAL(10,3) NOT NULL,
    "unitCost" DECIMAL(10,2) NOT NULL,
    "receivedQuantity" DECIMAL(10,3) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "purchase_order_lines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "purchase_invoices" (
    "id" VARCHAR(50) NOT NULL,
    "invoiceNumber" VARCHAR(50) NOT NULL,
    "supplierId" VARCHAR(50) NOT NULL,
    "warehouseId" VARCHAR(50) NOT NULL,
    "receivedBy" VARCHAR(50) NOT NULL,
    "purchaseOrderId" VARCHAR(50),
    "subtotal" DECIMAL(10,2) NOT NULL,
    "taxAmount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "discountAmount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "totalAmount" DECIMAL(10,2) NOT NULL,
    "currencyId" VARCHAR(50) NOT NULL,
    "exchangeRate" DECIMAL(18,8) NOT NULL DEFAULT 1,
    "baseCurrencyId" VARCHAR(50),
    "baseSubtotal" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "baseTaxAmount" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "baseDiscountAmount" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "baseTotalAmount" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "invoiceDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dueDate" TIMESTAMP(3),
    "status" VARCHAR(50) NOT NULL DEFAULT 'draft',
    "paymentStatus" VARCHAR(50) NOT NULL DEFAULT 'pending',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "purchase_invoices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "purchase_invoice_lines" (
    "id" VARCHAR(50) NOT NULL,
    "purchaseInvoiceId" VARCHAR(50) NOT NULL,
    "productVariantId" VARCHAR(50) NOT NULL,
    "warehouseId" VARCHAR(50) NOT NULL,
    "quantity" DECIMAL(10,3) NOT NULL,
    "unitCost" DECIMAL(10,2) NOT NULL,
    "discountAmount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "taxAmount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "lineTotal" DECIMAL(10,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "purchase_invoice_lines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "purchase_payments" (
    "id" VARCHAR(50) NOT NULL,
    "purchaseInvoiceId" VARCHAR(50) NOT NULL,
    "supplierId" VARCHAR(50) NOT NULL,
    "currencyId" VARCHAR(50) NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "exchangeRate" DECIMAL(18,8) NOT NULL DEFAULT 1,
    "baseCurrencyId" VARCHAR(50),
    "baseAmount" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "paymentMethod" VARCHAR(50) NOT NULL,
    "referenceNumber" VARCHAR(100),
    "notes" TEXT,
    "paymentDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedBy" VARCHAR(50),

    CONSTRAINT "purchase_payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gl_accounts" (
    "id" VARCHAR(50) NOT NULL,
    "accountCode" VARCHAR(20) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "accountType" VARCHAR(50) NOT NULL,
    "parentId" VARCHAR(50),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "debitBalance" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "creditBalance" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "gl_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "journal_entries" (
    "id" VARCHAR(50) NOT NULL,
    "entryNumber" VARCHAR(20) NOT NULL,
    "entryDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "description" TEXT NOT NULL,
    "referenceType" VARCHAR(50),
    "referenceId" VARCHAR(50),
    "sourceModule" VARCHAR(50),
    "status" VARCHAR(20) NOT NULL DEFAULT 'draft',
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "totalDebit" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "totalCredit" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "createdBy" VARCHAR(50),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "journal_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "journal_entry_lines" (
    "id" VARCHAR(50) NOT NULL,
    "journalEntryId" VARCHAR(50) NOT NULL,
    "lineNumber" INTEGER NOT NULL DEFAULT 1,
    "debitAccountId" VARCHAR(50) NOT NULL,
    "creditAccountId" VARCHAR(50) NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "description" TEXT,
    "referenceType" VARCHAR(50),
    "referenceId" VARCHAR(50),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "journal_entry_lines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" VARCHAR(50) NOT NULL,
    "userId" VARCHAR(50),
    "action" VARCHAR(50) NOT NULL,
    "entity" VARCHAR(100) NOT NULL,
    "entityId" VARCHAR(50) NOT NULL,
    "branchId" VARCHAR(50),
    "warehouseId" VARCHAR(50),
    "details" JSONB,
    "oldValues" JSONB,
    "newValues" JSONB,
    "ipAddress" VARCHAR(45),
    "userAgent" TEXT,
    "sessionId" VARCHAR(100),
    "success" BOOLEAN NOT NULL DEFAULT true,
    "errorMessage" TEXT,
    "severity" VARCHAR(20) NOT NULL DEFAULT 'info',
    "category" VARCHAR(50) NOT NULL DEFAULT 'business',
    "referenceType" VARCHAR(50),
    "referenceId" VARCHAR(50),
    "module" VARCHAR(50),
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "searchableText" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sync_batches" (
    "id" VARCHAR(50) NOT NULL,
    "batchId" VARCHAR(100) NOT NULL,
    "deviceId" VARCHAR(100) NOT NULL,
    "branchId" VARCHAR(50),
    "syncType" VARCHAR(50) NOT NULL,
    "direction" VARCHAR(20) NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'pending',
    "totalRecords" INTEGER NOT NULL DEFAULT 0,
    "processedRecords" INTEGER NOT NULL DEFAULT 0,
    "failedRecords" INTEGER NOT NULL DEFAULT 0,
    "conflictedRecords" INTEGER NOT NULL DEFAULT 0,
    "changes" JSONB,
    "conflicts" JSONB,
    "resolution" JSONB,
    "metadata" JSONB,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "lastSyncAt" TIMESTAMP(3),
    "clientVersion" VARCHAR(50),
    "serverVersion" VARCHAR(50),
    "priority" INTEGER NOT NULL DEFAULT 0,
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "maxRetries" INTEGER NOT NULL DEFAULT 3,
    "createdBy" VARCHAR(50),

    CONSTRAINT "sync_batches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sync_devices" (
    "id" VARCHAR(50) NOT NULL,
    "deviceId" VARCHAR(120) NOT NULL,
    "userId" VARCHAR(50) NOT NULL,
    "name" VARCHAR(255),
    "platform" VARCHAR(50),
    "lastSeenAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sync_devices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sync_operations" (
    "id" VARCHAR(50) NOT NULL,
    "deviceId" VARCHAR(120),
    "userId" VARCHAR(50),
    "entityType" VARCHAR(80) NOT NULL,
    "entityId" VARCHAR(50),
    "operation" VARCHAR(30) NOT NULL,
    "payload" JSONB NOT NULL,
    "idempotencyKey" VARCHAR(120),
    "status" VARCHAR(30) NOT NULL DEFAULT 'pending',
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "appliedAt" TIMESTAMP(3),

    CONSTRAINT "sync_operations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_transactions" (
    "id" VARCHAR(50) NOT NULL,
    "transactionId" VARCHAR(100) NOT NULL,
    "invoiceId" VARCHAR(50) NOT NULL,
    "invoiceType" VARCHAR(20) NOT NULL,
    "branchId" VARCHAR(50),
    "customerId" VARCHAR(50),
    "supplierId" VARCHAR(50),
    "gateway" VARCHAR(50) NOT NULL,
    "method" VARCHAR(50) NOT NULL,
    "currency" VARCHAR(3) NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "fee" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "status" VARCHAR(20) NOT NULL DEFAULT 'pending',
    "cardLast4" VARCHAR(4),
    "cardBrand" VARCHAR(20),
    "walletProvider" VARCHAR(50),
    "description" TEXT,
    "metadata" JSONB,
    "gatewayResponse" JSONB,
    "ipAddress" VARCHAR(45),
    "userAgent" TEXT,
    "processedBy" VARCHAR(50),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "refundedAt" TIMESTAMP(3),
    "refundAmount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "refundReason" TEXT,
    "refundMetadata" JSONB,
    "settledAt" TIMESTAMP(3),
    "settlementAmount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "settlementFee" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "externalId" VARCHAR(100),
    "batchId" VARCHAR(100),

    CONSTRAINT "payment_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" VARCHAR(50) NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "message" TEXT NOT NULL,
    "type" VARCHAR(50) NOT NULL,
    "recipientId" VARCHAR(50),
    "recipientType" VARCHAR(20) NOT NULL,
    "recipientEmail" VARCHAR(255),
    "recipientPhone" VARCHAR(50),
    "status" VARCHAR(20) NOT NULL DEFAULT 'pending',
    "provider" VARCHAR(50),
    "providerMessageId" VARCHAR(100),
    "sentAt" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),
    "failedAt" TIMESTAMP(3),
    "priority" VARCHAR(20) NOT NULL DEFAULT 'normal',
    "scheduledAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "templateId" VARCHAR(50),
    "data" JSONB,
    "responseData" JSONB,
    "clickedAt" TIMESTAMP(3),
    "readAt" TIMESTAMP(3),
    "module" VARCHAR(50),
    "event" VARCHAR(50),
    "referenceId" VARCHAR(50),
    "referenceType" VARCHAR(50),
    "sentBy" VARCHAR(50),
    "branchId" VARCHAR(50),
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "maxRetries" INTEGER NOT NULL DEFAULT 3,
    "lastError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_templates" (
    "id" VARCHAR(50) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "type" VARCHAR(50) NOT NULL,
    "subject" VARCHAR(255),
    "content" TEXT NOT NULL,
    "htmlContent" TEXT,
    "variables" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "language" VARCHAR(10) NOT NULL DEFAULT 'ar',
    "locale" VARCHAR(10) NOT NULL DEFAULT 'ar-SA',
    "event" VARCHAR(50) NOT NULL,
    "module" VARCHAR(50) NOT NULL,
    "priority" VARCHAR(20) NOT NULL DEFAULT 'normal',
    "channels" JSONB,
    "createdBy" VARCHAR(50),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notification_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_preferences" (
    "id" VARCHAR(50) NOT NULL,
    "userId" VARCHAR(50) NOT NULL,
    "notificationType" VARCHAR(50) NOT NULL,
    "event" VARCHAR(50) NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "frequency" VARCHAR(20) NOT NULL DEFAULT 'immediate',
    "quietHoursStart" VARCHAR(5),
    "quietHoursEnd" VARCHAR(5),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notification_preferences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "files" (
    "id" VARCHAR(50) NOT NULL,
    "originalName" VARCHAR(255) NOT NULL,
    "filename" VARCHAR(255) NOT NULL,
    "mimeType" VARCHAR(100) NOT NULL,
    "size" BIGINT NOT NULL,
    "extension" VARCHAR(10) NOT NULL,
    "path" VARCHAR(500) NOT NULL,
    "key" VARCHAR(500) NOT NULL DEFAULT '',
    "url" VARCHAR(1000),
    "bucket" VARCHAR(100) NOT NULL,
    "storageProvider" VARCHAR(50) NOT NULL DEFAULT 'local',
    "category" VARCHAR(50) NOT NULL,
    "entityType" VARCHAR(50),
    "entityId" VARCHAR(50),
    "metadata" JSONB,
    "checksum" VARCHAR(128),
    "thumbnailPath" VARCHAR(500),
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "accessToken" VARCHAR(100),
    "expiresAt" TIMESTAMP(3),
    "uploadedBy" VARCHAR(50),
    "branchId" VARCHAR(50),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "files_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "file_versions" (
    "id" VARCHAR(50) NOT NULL,
    "fileId" VARCHAR(50) NOT NULL,
    "version" INTEGER NOT NULL,
    "originalName" VARCHAR(255) NOT NULL,
    "filename" VARCHAR(255) NOT NULL,
    "mimeType" VARCHAR(100) NOT NULL,
    "size" BIGINT NOT NULL,
    "path" VARCHAR(500) NOT NULL,
    "url" VARCHAR(1000),
    "checksum" VARCHAR(128),
    "modifiedBy" VARCHAR(50),
    "changeReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "file_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "file_access_logs" (
    "id" VARCHAR(50) NOT NULL,
    "fileId" VARCHAR(50) NOT NULL,
    "accessedBy" VARCHAR(50),
    "accessType" VARCHAR(20) NOT NULL,
    "accessMethod" VARCHAR(20) NOT NULL,
    "ipAddress" VARCHAR(45),
    "userAgent" TEXT,
    "referer" VARCHAR(500),
    "responseStatus" INTEGER,
    "metadata" JSONB,
    "accessedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "file_access_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "storage_buckets" (
    "id" VARCHAR(50) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "displayName" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "provider" VARCHAR(50) NOT NULL,
    "region" VARCHAR(50),
    "bucketName" VARCHAR(100),
    "basePath" VARCHAR(500) NOT NULL DEFAULT '',
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "allowedMimeTypes" TEXT,
    "maxFileSize" BIGINT,
    "allowedExtensions" TEXT,
    "backupEnabled" BOOLEAN NOT NULL DEFAULT false,
    "backupProvider" VARCHAR(50),
    "backupBucket" VARCHAR(100),
    "imageOptimization" BOOLEAN NOT NULL DEFAULT true,
    "generateThumbnails" BOOLEAN NOT NULL DEFAULT true,
    "thumbnailSizes" JSONB,
    "createdBy" VARCHAR(50),
    "totalFiles" BIGINT NOT NULL DEFAULT 0,
    "totalSize" BIGINT NOT NULL DEFAULT 0,
    "lastActivityAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "storage_buckets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "backup_metadata" (
    "id" VARCHAR(50) NOT NULL,
    "backupId" VARCHAR(100) NOT NULL,
    "type" VARCHAR(20) NOT NULL,
    "status" VARCHAR(20) NOT NULL,
    "path" VARCHAR(500) NOT NULL,
    "size" BIGINT NOT NULL DEFAULT 0,
    "checksum" VARCHAR(128) NOT NULL,
    "encrypted" BOOLEAN NOT NULL DEFAULT true,
    "duration" BIGINT NOT NULL DEFAULT 0,
    "compressionRatio" DECIMAL(5,2),
    "databaseVersion" VARCHAR(50),
    "schemaVersion" VARCHAR(50),
    "recordCount" BIGINT,
    "error" TEXT,
    "errorDetails" JSONB,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "restoredAt" TIMESTAMP(3),
    "restoredBy" VARCHAR(50),
    "createdBy" VARCHAR(50),
    "branchId" VARCHAR(50),
    "includeData" BOOLEAN NOT NULL DEFAULT true,
    "includeSchema" BOOLEAN NOT NULL DEFAULT true,
    "includeFiles" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "backup_metadata_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_BranchManager" (
    "A" VARCHAR(50) NOT NULL,
    "B" VARCHAR(50) NOT NULL,

    CONSTRAINT "_BranchManager_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "branches_code_key" ON "branches"("code");

-- CreateIndex
CREATE INDEX "branches_companyId_idx" ON "branches"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "warehouses_code_key" ON "warehouses"("code");

-- CreateIndex
CREATE INDEX "warehouses_branchId_idx" ON "warehouses"("branchId");

-- CreateIndex
CREATE INDEX "warehouses_managerId_idx" ON "warehouses"("managerId");

-- CreateIndex
CREATE UNIQUE INDEX "roles_name_key" ON "roles"("name");

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_branchId_idx" ON "users"("branchId");

-- CreateIndex
CREATE INDEX "users_roleId_idx" ON "users"("roleId");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE INDEX "categories_parentId_idx" ON "categories"("parentId");

-- CreateIndex
CREATE UNIQUE INDEX "products_barcode_key" ON "products"("barcode");

-- CreateIndex
CREATE UNIQUE INDEX "products_sku_key" ON "products"("sku");

-- CreateIndex
CREATE INDEX "products_categoryId_idx" ON "products"("categoryId");

-- CreateIndex
CREATE INDEX "products_barcode_idx" ON "products"("barcode");

-- CreateIndex
CREATE INDEX "products_sku_idx" ON "products"("sku");

-- CreateIndex
CREATE UNIQUE INDEX "product_variants_sku_key" ON "product_variants"("sku");

-- CreateIndex
CREATE UNIQUE INDEX "product_variants_barcode_key" ON "product_variants"("barcode");

-- CreateIndex
CREATE INDEX "product_variants_productId_idx" ON "product_variants"("productId");

-- CreateIndex
CREATE INDEX "product_variants_sku_idx" ON "product_variants"("sku");

-- CreateIndex
CREATE INDEX "product_variants_barcode_idx" ON "product_variants"("barcode");

-- CreateIndex
CREATE INDEX "stock_items_warehouseId_idx" ON "stock_items"("warehouseId");

-- CreateIndex
CREATE INDEX "stock_items_productVariantId_idx" ON "stock_items"("productVariantId");

-- CreateIndex
CREATE INDEX "stock_items_warehouseId_productVariantId_idx" ON "stock_items"("warehouseId", "productVariantId");

-- CreateIndex
CREATE INDEX "stock_items_quantity_idx" ON "stock_items"("quantity");

-- CreateIndex
CREATE INDEX "stock_items_minStock_idx" ON "stock_items"("minStock");

-- CreateIndex
CREATE INDEX "stock_items_warehouseId_quantity_idx" ON "stock_items"("warehouseId", "quantity");

-- CreateIndex
CREATE INDEX "stock_items_productVariantId_warehouseId_quantity_idx" ON "stock_items"("productVariantId", "warehouseId", "quantity");

-- CreateIndex
CREATE UNIQUE INDEX "stock_items_warehouseId_productVariantId_key" ON "stock_items"("warehouseId", "productVariantId");

-- CreateIndex
CREATE INDEX "stock_movements_warehouseId_idx" ON "stock_movements"("warehouseId");

-- CreateIndex
CREATE INDEX "stock_movements_productVariantId_idx" ON "stock_movements"("productVariantId");

-- CreateIndex
CREATE INDEX "stock_movements_referenceType_idx" ON "stock_movements"("referenceType");

-- CreateIndex
CREATE INDEX "stock_movements_referenceId_idx" ON "stock_movements"("referenceId");

-- CreateIndex
CREATE INDEX "customers_email_idx" ON "customers"("email");

-- CreateIndex
CREATE INDEX "customers_phone_idx" ON "customers"("phone");

-- CreateIndex
CREATE INDEX "customers_loyaltyTier_idx" ON "customers"("loyaltyTier");

-- CreateIndex
CREATE INDEX "customers_lastPurchaseDate_idx" ON "customers"("lastPurchaseDate");

-- CreateIndex
CREATE UNIQUE INDEX "currencies_code_key" ON "currencies"("code");

-- CreateIndex
CREATE INDEX "currencies_code_idx" ON "currencies"("code");

-- CreateIndex
CREATE INDEX "exchange_rates_fromCurrencyId_toCurrencyId_effectiveAt_idx" ON "exchange_rates"("fromCurrencyId", "toCurrencyId", "effectiveAt");

-- CreateIndex
CREATE INDEX "app_settings_scope_scopeId_idx" ON "app_settings"("scope", "scopeId");

-- CreateIndex
CREATE UNIQUE INDEX "app_settings_scope_scopeId_key_key" ON "app_settings"("scope", "scopeId", "key");

-- CreateIndex
CREATE UNIQUE INDEX "sales_invoices_invoiceNumber_key" ON "sales_invoices"("invoiceNumber");

-- CreateIndex
CREATE INDEX "sales_invoices_branchId_idx" ON "sales_invoices"("branchId");

-- CreateIndex
CREATE INDEX "sales_invoices_customerId_idx" ON "sales_invoices"("customerId");

-- CreateIndex
CREATE INDEX "sales_invoices_cashierId_idx" ON "sales_invoices"("cashierId");

-- CreateIndex
CREATE INDEX "sales_invoices_warehouseId_idx" ON "sales_invoices"("warehouseId");

-- CreateIndex
CREATE INDEX "sales_invoices_status_idx" ON "sales_invoices"("status");

-- CreateIndex
CREATE INDEX "sales_invoices_paymentStatus_idx" ON "sales_invoices"("paymentStatus");

-- CreateIndex
CREATE INDEX "sales_invoices_invoiceNumber_idx" ON "sales_invoices"("invoiceNumber");

-- CreateIndex
CREATE INDEX "sales_invoices_branchId_status_idx" ON "sales_invoices"("branchId", "status");

-- CreateIndex
CREATE INDEX "sales_invoices_customerId_createdAt_idx" ON "sales_invoices"("customerId", "createdAt");

-- CreateIndex
CREATE INDEX "sales_invoices_createdAt_status_idx" ON "sales_invoices"("createdAt", "status");

-- CreateIndex
CREATE INDEX "sales_invoices_branchId_createdAt_idx" ON "sales_invoices"("branchId", "createdAt");

-- CreateIndex
CREATE INDEX "sales_invoices_invoiceNumber_branchId_idx" ON "sales_invoices"("invoiceNumber", "branchId");

-- CreateIndex
CREATE INDEX "sales_invoice_lines_salesInvoiceId_idx" ON "sales_invoice_lines"("salesInvoiceId");

-- CreateIndex
CREATE INDEX "sales_invoice_lines_productVariantId_idx" ON "sales_invoice_lines"("productVariantId");

-- CreateIndex
CREATE INDEX "sales_invoice_lines_warehouseId_idx" ON "sales_invoice_lines"("warehouseId");

-- CreateIndex
CREATE INDEX "payments_salesInvoiceId_idx" ON "payments"("salesInvoiceId");

-- CreateIndex
CREATE INDEX "payments_customerId_idx" ON "payments"("customerId");

-- CreateIndex
CREATE INDEX "payments_currencyId_idx" ON "payments"("currencyId");

-- CreateIndex
CREATE INDEX "payments_paymentMethod_idx" ON "payments"("paymentMethod");

-- CreateIndex
CREATE UNIQUE INDEX "returns_returnNumber_key" ON "returns"("returnNumber");

-- CreateIndex
CREATE INDEX "returns_salesInvoiceId_idx" ON "returns"("salesInvoiceId");

-- CreateIndex
CREATE INDEX "returns_customerId_idx" ON "returns"("customerId");

-- CreateIndex
CREATE INDEX "returns_cashierId_idx" ON "returns"("cashierId");

-- CreateIndex
CREATE INDEX "returns_warehouseId_idx" ON "returns"("warehouseId");

-- CreateIndex
CREATE INDEX "returns_status_idx" ON "returns"("status");

-- CreateIndex
CREATE INDEX "returns_refundStatus_idx" ON "returns"("refundStatus");

-- CreateIndex
CREATE INDEX "returns_returnNumber_idx" ON "returns"("returnNumber");

-- CreateIndex
CREATE INDEX "return_lines_returnId_idx" ON "return_lines"("returnId");

-- CreateIndex
CREATE INDEX "return_lines_productVariantId_idx" ON "return_lines"("productVariantId");

-- CreateIndex
CREATE INDEX "return_lines_warehouseId_idx" ON "return_lines"("warehouseId");

-- CreateIndex
CREATE UNIQUE INDEX "credit_notes_creditNoteNumber_key" ON "credit_notes"("creditNoteNumber");

-- CreateIndex
CREATE INDEX "credit_notes_returnId_idx" ON "credit_notes"("returnId");

-- CreateIndex
CREATE INDEX "credit_notes_customerId_idx" ON "credit_notes"("customerId");

-- CreateIndex
CREATE INDEX "credit_notes_currencyId_idx" ON "credit_notes"("currencyId");

-- CreateIndex
CREATE INDEX "credit_notes_status_idx" ON "credit_notes"("status");

-- CreateIndex
CREATE INDEX "credit_notes_creditNoteNumber_idx" ON "credit_notes"("creditNoteNumber");

-- CreateIndex
CREATE INDEX "suppliers_email_idx" ON "suppliers"("email");

-- CreateIndex
CREATE INDEX "suppliers_phone_idx" ON "suppliers"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "purchase_orders_orderNumber_key" ON "purchase_orders"("orderNumber");

-- CreateIndex
CREATE INDEX "purchase_orders_supplierId_idx" ON "purchase_orders"("supplierId");

-- CreateIndex
CREATE INDEX "purchase_orders_warehouseId_idx" ON "purchase_orders"("warehouseId");

-- CreateIndex
CREATE INDEX "purchase_orders_status_idx" ON "purchase_orders"("status");

-- CreateIndex
CREATE INDEX "purchase_orders_orderNumber_idx" ON "purchase_orders"("orderNumber");

-- CreateIndex
CREATE INDEX "purchase_order_lines_purchaseOrderId_idx" ON "purchase_order_lines"("purchaseOrderId");

-- CreateIndex
CREATE INDEX "purchase_order_lines_productId_idx" ON "purchase_order_lines"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "purchase_invoices_invoiceNumber_key" ON "purchase_invoices"("invoiceNumber");

-- CreateIndex
CREATE INDEX "purchase_invoices_supplierId_idx" ON "purchase_invoices"("supplierId");

-- CreateIndex
CREATE INDEX "purchase_invoices_warehouseId_idx" ON "purchase_invoices"("warehouseId");

-- CreateIndex
CREATE INDEX "purchase_invoices_purchaseOrderId_idx" ON "purchase_invoices"("purchaseOrderId");

-- CreateIndex
CREATE INDEX "purchase_invoices_status_idx" ON "purchase_invoices"("status");

-- CreateIndex
CREATE INDEX "purchase_invoices_paymentStatus_idx" ON "purchase_invoices"("paymentStatus");

-- CreateIndex
CREATE INDEX "purchase_invoices_invoiceNumber_idx" ON "purchase_invoices"("invoiceNumber");

-- CreateIndex
CREATE INDEX "purchase_invoice_lines_purchaseInvoiceId_idx" ON "purchase_invoice_lines"("purchaseInvoiceId");

-- CreateIndex
CREATE INDEX "purchase_invoice_lines_productVariantId_idx" ON "purchase_invoice_lines"("productVariantId");

-- CreateIndex
CREATE INDEX "purchase_invoice_lines_warehouseId_idx" ON "purchase_invoice_lines"("warehouseId");

-- CreateIndex
CREATE INDEX "purchase_payments_purchaseInvoiceId_idx" ON "purchase_payments"("purchaseInvoiceId");

-- CreateIndex
CREATE INDEX "purchase_payments_supplierId_idx" ON "purchase_payments"("supplierId");

-- CreateIndex
CREATE INDEX "purchase_payments_currencyId_idx" ON "purchase_payments"("currencyId");

-- CreateIndex
CREATE INDEX "purchase_payments_paymentMethod_idx" ON "purchase_payments"("paymentMethod");

-- CreateIndex
CREATE UNIQUE INDEX "gl_accounts_accountCode_key" ON "gl_accounts"("accountCode");

-- CreateIndex
CREATE INDEX "gl_accounts_accountCode_idx" ON "gl_accounts"("accountCode");

-- CreateIndex
CREATE INDEX "gl_accounts_accountType_idx" ON "gl_accounts"("accountType");

-- CreateIndex
CREATE INDEX "gl_accounts_parentId_idx" ON "gl_accounts"("parentId");

-- CreateIndex
CREATE UNIQUE INDEX "journal_entries_entryNumber_key" ON "journal_entries"("entryNumber");

-- CreateIndex
CREATE INDEX "journal_entries_entryNumber_idx" ON "journal_entries"("entryNumber");

-- CreateIndex
CREATE INDEX "journal_entries_entryDate_idx" ON "journal_entries"("entryDate");

-- CreateIndex
CREATE INDEX "journal_entries_referenceType_idx" ON "journal_entries"("referenceType");

-- CreateIndex
CREATE INDEX "journal_entries_referenceId_idx" ON "journal_entries"("referenceId");

-- CreateIndex
CREATE INDEX "journal_entries_status_idx" ON "journal_entries"("status");

-- CreateIndex
CREATE INDEX "journal_entries_sourceModule_idx" ON "journal_entries"("sourceModule");

-- CreateIndex
CREATE INDEX "journal_entry_lines_journalEntryId_idx" ON "journal_entry_lines"("journalEntryId");

-- CreateIndex
CREATE INDEX "journal_entry_lines_debitAccountId_idx" ON "journal_entry_lines"("debitAccountId");

-- CreateIndex
CREATE INDEX "journal_entry_lines_creditAccountId_idx" ON "journal_entry_lines"("creditAccountId");

-- CreateIndex
CREATE INDEX "journal_entry_lines_referenceType_idx" ON "journal_entry_lines"("referenceType");

-- CreateIndex
CREATE INDEX "journal_entry_lines_referenceId_idx" ON "journal_entry_lines"("referenceId");

-- CreateIndex
CREATE INDEX "audit_logs_userId_idx" ON "audit_logs"("userId");

-- CreateIndex
CREATE INDEX "audit_logs_action_idx" ON "audit_logs"("action");

-- CreateIndex
CREATE INDEX "audit_logs_entity_idx" ON "audit_logs"("entity");

-- CreateIndex
CREATE INDEX "audit_logs_entityId_idx" ON "audit_logs"("entityId");

-- CreateIndex
CREATE INDEX "audit_logs_branchId_idx" ON "audit_logs"("branchId");

-- CreateIndex
CREATE INDEX "audit_logs_warehouseId_idx" ON "audit_logs"("warehouseId");

-- CreateIndex
CREATE INDEX "audit_logs_timestamp_idx" ON "audit_logs"("timestamp");

-- CreateIndex
CREATE INDEX "audit_logs_success_idx" ON "audit_logs"("success");

-- CreateIndex
CREATE INDEX "audit_logs_severity_idx" ON "audit_logs"("severity");

-- CreateIndex
CREATE INDEX "audit_logs_category_idx" ON "audit_logs"("category");

-- CreateIndex
CREATE INDEX "audit_logs_referenceType_idx" ON "audit_logs"("referenceType");

-- CreateIndex
CREATE INDEX "audit_logs_referenceId_idx" ON "audit_logs"("referenceId");

-- CreateIndex
CREATE INDEX "audit_logs_module_idx" ON "audit_logs"("module");

-- CreateIndex
CREATE INDEX "audit_logs_searchableText_idx" ON "audit_logs"("searchableText");

-- CreateIndex
CREATE INDEX "audit_logs_timestamp_severity_idx" ON "audit_logs"("timestamp", "severity");

-- CreateIndex
CREATE INDEX "audit_logs_entity_action_timestamp_idx" ON "audit_logs"("entity", "action", "timestamp");

-- CreateIndex
CREATE INDEX "audit_logs_userId_timestamp_idx" ON "audit_logs"("userId", "timestamp");

-- CreateIndex
CREATE INDEX "audit_logs_module_timestamp_idx" ON "audit_logs"("module", "timestamp");

-- CreateIndex
CREATE INDEX "audit_logs_category_severity_timestamp_idx" ON "audit_logs"("category", "severity", "timestamp");

-- CreateIndex
CREATE UNIQUE INDEX "sync_batches_batchId_key" ON "sync_batches"("batchId");

-- CreateIndex
CREATE INDEX "sync_batches_batchId_idx" ON "sync_batches"("batchId");

-- CreateIndex
CREATE INDEX "sync_batches_deviceId_idx" ON "sync_batches"("deviceId");

-- CreateIndex
CREATE INDEX "sync_batches_branchId_idx" ON "sync_batches"("branchId");

-- CreateIndex
CREATE INDEX "sync_batches_status_idx" ON "sync_batches"("status");

-- CreateIndex
CREATE INDEX "sync_batches_syncType_idx" ON "sync_batches"("syncType");

-- CreateIndex
CREATE INDEX "sync_batches_direction_idx" ON "sync_batches"("direction");

-- CreateIndex
CREATE INDEX "sync_batches_createdAt_idx" ON "sync_batches"("createdAt");

-- CreateIndex
CREATE INDEX "sync_batches_lastSyncAt_idx" ON "sync_batches"("lastSyncAt");

-- CreateIndex
CREATE UNIQUE INDEX "sync_devices_deviceId_key" ON "sync_devices"("deviceId");

-- CreateIndex
CREATE INDEX "sync_devices_userId_idx" ON "sync_devices"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "sync_operations_idempotencyKey_key" ON "sync_operations"("idempotencyKey");

-- CreateIndex
CREATE INDEX "sync_operations_deviceId_status_idx" ON "sync_operations"("deviceId", "status");

-- CreateIndex
CREATE INDEX "sync_operations_entityType_entityId_idx" ON "sync_operations"("entityType", "entityId");

-- CreateIndex
CREATE UNIQUE INDEX "payment_transactions_transactionId_key" ON "payment_transactions"("transactionId");

-- CreateIndex
CREATE INDEX "payment_transactions_transactionId_idx" ON "payment_transactions"("transactionId");

-- CreateIndex
CREATE INDEX "payment_transactions_invoiceId_idx" ON "payment_transactions"("invoiceId");

-- CreateIndex
CREATE INDEX "payment_transactions_invoiceType_idx" ON "payment_transactions"("invoiceType");

-- CreateIndex
CREATE INDEX "payment_transactions_branchId_idx" ON "payment_transactions"("branchId");

-- CreateIndex
CREATE INDEX "payment_transactions_customerId_idx" ON "payment_transactions"("customerId");

-- CreateIndex
CREATE INDEX "payment_transactions_supplierId_idx" ON "payment_transactions"("supplierId");

-- CreateIndex
CREATE INDEX "payment_transactions_gateway_idx" ON "payment_transactions"("gateway");

-- CreateIndex
CREATE INDEX "payment_transactions_method_idx" ON "payment_transactions"("method");

-- CreateIndex
CREATE INDEX "payment_transactions_status_idx" ON "payment_transactions"("status");

-- CreateIndex
CREATE INDEX "payment_transactions_createdAt_idx" ON "payment_transactions"("createdAt");

-- CreateIndex
CREATE INDEX "payment_transactions_processedAt_idx" ON "payment_transactions"("processedAt");

-- CreateIndex
CREATE INDEX "payment_transactions_completedAt_idx" ON "payment_transactions"("completedAt");

-- CreateIndex
CREATE INDEX "notifications_recipientId_idx" ON "notifications"("recipientId");

-- CreateIndex
CREATE INDEX "notifications_recipientType_idx" ON "notifications"("recipientType");

-- CreateIndex
CREATE INDEX "notifications_status_idx" ON "notifications"("status");

-- CreateIndex
CREATE INDEX "notifications_type_idx" ON "notifications"("type");

-- CreateIndex
CREATE INDEX "notifications_provider_idx" ON "notifications"("provider");

-- CreateIndex
CREATE INDEX "notifications_priority_idx" ON "notifications"("priority");

-- CreateIndex
CREATE INDEX "notifications_scheduledAt_idx" ON "notifications"("scheduledAt");

-- CreateIndex
CREATE INDEX "notifications_module_idx" ON "notifications"("module");

-- CreateIndex
CREATE INDEX "notifications_event_idx" ON "notifications"("event");

-- CreateIndex
CREATE INDEX "notifications_createdAt_idx" ON "notifications"("createdAt");

-- CreateIndex
CREATE INDEX "notifications_sentAt_idx" ON "notifications"("sentAt");

-- CreateIndex
CREATE UNIQUE INDEX "notification_templates_name_key" ON "notification_templates"("name");

-- CreateIndex
CREATE INDEX "notification_templates_name_idx" ON "notification_templates"("name");

-- CreateIndex
CREATE INDEX "notification_templates_type_idx" ON "notification_templates"("type");

-- CreateIndex
CREATE INDEX "notification_templates_event_idx" ON "notification_templates"("event");

-- CreateIndex
CREATE INDEX "notification_templates_module_idx" ON "notification_templates"("module");

-- CreateIndex
CREATE INDEX "notification_templates_language_idx" ON "notification_templates"("language");

-- CreateIndex
CREATE INDEX "notification_templates_isActive_idx" ON "notification_templates"("isActive");

-- CreateIndex
CREATE INDEX "notification_preferences_userId_idx" ON "notification_preferences"("userId");

-- CreateIndex
CREATE INDEX "notification_preferences_notificationType_idx" ON "notification_preferences"("notificationType");

-- CreateIndex
CREATE INDEX "notification_preferences_event_idx" ON "notification_preferences"("event");

-- CreateIndex
CREATE INDEX "notification_preferences_enabled_idx" ON "notification_preferences"("enabled");

-- CreateIndex
CREATE UNIQUE INDEX "notification_preferences_userId_notificationType_event_key" ON "notification_preferences"("userId", "notificationType", "event");

-- CreateIndex
CREATE UNIQUE INDEX "files_accessToken_key" ON "files"("accessToken");

-- CreateIndex
CREATE INDEX "files_category_idx" ON "files"("category");

-- CreateIndex
CREATE INDEX "files_entityType_idx" ON "files"("entityType");

-- CreateIndex
CREATE INDEX "files_entityId_idx" ON "files"("entityId");

-- CreateIndex
CREATE INDEX "files_uploadedBy_idx" ON "files"("uploadedBy");

-- CreateIndex
CREATE INDEX "files_branchId_idx" ON "files"("branchId");

-- CreateIndex
CREATE INDEX "files_isPublic_idx" ON "files"("isPublic");

-- CreateIndex
CREATE INDEX "files_expiresAt_idx" ON "files"("expiresAt");

-- CreateIndex
CREATE INDEX "files_createdAt_idx" ON "files"("createdAt");

-- CreateIndex
CREATE INDEX "file_versions_fileId_idx" ON "file_versions"("fileId");

-- CreateIndex
CREATE INDEX "file_versions_modifiedBy_idx" ON "file_versions"("modifiedBy");

-- CreateIndex
CREATE UNIQUE INDEX "file_versions_fileId_version_key" ON "file_versions"("fileId", "version");

-- CreateIndex
CREATE INDEX "file_access_logs_fileId_idx" ON "file_access_logs"("fileId");

-- CreateIndex
CREATE INDEX "file_access_logs_accessedBy_idx" ON "file_access_logs"("accessedBy");

-- CreateIndex
CREATE INDEX "file_access_logs_accessType_idx" ON "file_access_logs"("accessType");

-- CreateIndex
CREATE INDEX "file_access_logs_accessedAt_idx" ON "file_access_logs"("accessedAt");

-- CreateIndex
CREATE UNIQUE INDEX "storage_buckets_name_key" ON "storage_buckets"("name");

-- CreateIndex
CREATE INDEX "storage_buckets_provider_idx" ON "storage_buckets"("provider");

-- CreateIndex
CREATE INDEX "storage_buckets_isPublic_idx" ON "storage_buckets"("isPublic");

-- CreateIndex
CREATE UNIQUE INDEX "backup_metadata_backupId_key" ON "backup_metadata"("backupId");

-- CreateIndex
CREATE INDEX "backup_metadata_backupId_idx" ON "backup_metadata"("backupId");

-- CreateIndex
CREATE INDEX "backup_metadata_type_idx" ON "backup_metadata"("type");

-- CreateIndex
CREATE INDEX "backup_metadata_status_idx" ON "backup_metadata"("status");

-- CreateIndex
CREATE INDEX "backup_metadata_timestamp_idx" ON "backup_metadata"("timestamp");

-- CreateIndex
CREATE INDEX "backup_metadata_createdBy_idx" ON "backup_metadata"("createdBy");

-- CreateIndex
CREATE INDEX "backup_metadata_branchId_idx" ON "backup_metadata"("branchId");

-- CreateIndex
CREATE INDEX "backup_metadata_restoredAt_idx" ON "backup_metadata"("restoredAt");

-- CreateIndex
CREATE INDEX "backup_metadata_status_timestamp_idx" ON "backup_metadata"("status", "timestamp");

-- CreateIndex
CREATE INDEX "backup_metadata_type_timestamp_idx" ON "backup_metadata"("type", "timestamp");

-- CreateIndex
CREATE INDEX "_BranchManager_B_index" ON "_BranchManager"("B");

-- AddForeignKey
ALTER TABLE "branches" ADD CONSTRAINT "branches_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "warehouses" ADD CONSTRAINT "warehouses_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "warehouses" ADD CONSTRAINT "warehouses_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "categories" ADD CONSTRAINT "categories_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_taxId_fkey" FOREIGN KEY ("taxId") REFERENCES "taxes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_variants" ADD CONSTRAINT "product_variants_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_items" ADD CONSTRAINT "stock_items_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "warehouses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_items" ADD CONSTRAINT "stock_items_productVariantId_fkey" FOREIGN KEY ("productVariantId") REFERENCES "product_variants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "warehouses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_productVariantId_fkey" FOREIGN KEY ("productVariantId") REFERENCES "product_variants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_warehouseId_productVariantId_fkey" FOREIGN KEY ("warehouseId", "productVariantId") REFERENCES "stock_items"("warehouseId", "productVariantId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exchange_rates" ADD CONSTRAINT "exchange_rates_fromCurrencyId_fkey" FOREIGN KEY ("fromCurrencyId") REFERENCES "currencies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exchange_rates" ADD CONSTRAINT "exchange_rates_toCurrencyId_fkey" FOREIGN KEY ("toCurrencyId") REFERENCES "currencies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_invoices" ADD CONSTRAINT "sales_invoices_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_invoices" ADD CONSTRAINT "sales_invoices_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_invoices" ADD CONSTRAINT "sales_invoices_cashierId_fkey" FOREIGN KEY ("cashierId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_invoices" ADD CONSTRAINT "sales_invoices_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "warehouses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_invoices" ADD CONSTRAINT "sales_invoices_currencyId_fkey" FOREIGN KEY ("currencyId") REFERENCES "currencies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_invoices" ADD CONSTRAINT "sales_invoices_taxId_fkey" FOREIGN KEY ("taxId") REFERENCES "taxes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_invoice_lines" ADD CONSTRAINT "sales_invoice_lines_salesInvoiceId_fkey" FOREIGN KEY ("salesInvoiceId") REFERENCES "sales_invoices"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_invoice_lines" ADD CONSTRAINT "sales_invoice_lines_productVariantId_fkey" FOREIGN KEY ("productVariantId") REFERENCES "product_variants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_invoice_lines" ADD CONSTRAINT "sales_invoice_lines_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "warehouses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_salesInvoiceId_fkey" FOREIGN KEY ("salesInvoiceId") REFERENCES "sales_invoices"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_currencyId_fkey" FOREIGN KEY ("currencyId") REFERENCES "currencies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_processedBy_fkey" FOREIGN KEY ("processedBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "returns" ADD CONSTRAINT "returns_salesInvoiceId_fkey" FOREIGN KEY ("salesInvoiceId") REFERENCES "sales_invoices"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "returns" ADD CONSTRAINT "returns_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "returns" ADD CONSTRAINT "returns_cashierId_fkey" FOREIGN KEY ("cashierId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "returns" ADD CONSTRAINT "returns_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "warehouses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "returns" ADD CONSTRAINT "returns_currencyId_fkey" FOREIGN KEY ("currencyId") REFERENCES "currencies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "return_lines" ADD CONSTRAINT "return_lines_returnId_fkey" FOREIGN KEY ("returnId") REFERENCES "returns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "return_lines" ADD CONSTRAINT "return_lines_productVariantId_fkey" FOREIGN KEY ("productVariantId") REFERENCES "product_variants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "return_lines" ADD CONSTRAINT "return_lines_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "warehouses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "credit_notes" ADD CONSTRAINT "credit_notes_returnId_fkey" FOREIGN KEY ("returnId") REFERENCES "returns"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "credit_notes" ADD CONSTRAINT "credit_notes_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "credit_notes" ADD CONSTRAINT "credit_notes_currencyId_fkey" FOREIGN KEY ("currencyId") REFERENCES "currencies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "suppliers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "warehouses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_requestedBy_fkey" FOREIGN KEY ("requestedBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_order_lines" ADD CONSTRAINT "purchase_order_lines_purchaseOrderId_fkey" FOREIGN KEY ("purchaseOrderId") REFERENCES "purchase_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_order_lines" ADD CONSTRAINT "purchase_order_lines_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_invoices" ADD CONSTRAINT "purchase_invoices_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "suppliers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_invoices" ADD CONSTRAINT "purchase_invoices_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "warehouses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_invoices" ADD CONSTRAINT "purchase_invoices_receivedBy_fkey" FOREIGN KEY ("receivedBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_invoices" ADD CONSTRAINT "purchase_invoices_purchaseOrderId_fkey" FOREIGN KEY ("purchaseOrderId") REFERENCES "purchase_orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_invoices" ADD CONSTRAINT "purchase_invoices_currencyId_fkey" FOREIGN KEY ("currencyId") REFERENCES "currencies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_invoice_lines" ADD CONSTRAINT "purchase_invoice_lines_purchaseInvoiceId_fkey" FOREIGN KEY ("purchaseInvoiceId") REFERENCES "purchase_invoices"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_invoice_lines" ADD CONSTRAINT "purchase_invoice_lines_productVariantId_fkey" FOREIGN KEY ("productVariantId") REFERENCES "product_variants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_invoice_lines" ADD CONSTRAINT "purchase_invoice_lines_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "warehouses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_payments" ADD CONSTRAINT "purchase_payments_purchaseInvoiceId_fkey" FOREIGN KEY ("purchaseInvoiceId") REFERENCES "purchase_invoices"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_payments" ADD CONSTRAINT "purchase_payments_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "suppliers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_payments" ADD CONSTRAINT "purchase_payments_currencyId_fkey" FOREIGN KEY ("currencyId") REFERENCES "currencies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_payments" ADD CONSTRAINT "purchase_payments_processedBy_fkey" FOREIGN KEY ("processedBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gl_accounts" ADD CONSTRAINT "gl_accounts_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "gl_accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "journal_entries" ADD CONSTRAINT "journal_entries_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "journal_entry_lines" ADD CONSTRAINT "journal_entry_lines_debitAccountId_fkey" FOREIGN KEY ("debitAccountId") REFERENCES "gl_accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "journal_entry_lines" ADD CONSTRAINT "journal_entry_lines_creditAccountId_fkey" FOREIGN KEY ("creditAccountId") REFERENCES "gl_accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "journal_entry_lines" ADD CONSTRAINT "journal_entry_lines_journalEntryId_fkey" FOREIGN KEY ("journalEntryId") REFERENCES "journal_entries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "warehouses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sync_batches" ADD CONSTRAINT "sync_batches_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sync_batches" ADD CONSTRAINT "sync_batches_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sync_devices" ADD CONSTRAINT "sync_devices_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_transactions" ADD CONSTRAINT "payment_transactions_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_transactions" ADD CONSTRAINT "payment_transactions_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_transactions" ADD CONSTRAINT "payment_transactions_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "suppliers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_transactions" ADD CONSTRAINT "payment_transactions_processedBy_fkey" FOREIGN KEY ("processedBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "notification_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_sentBy_fkey" FOREIGN KEY ("sentBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_templates" ADD CONSTRAINT "notification_templates_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_preferences" ADD CONSTRAINT "notification_preferences_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "files" ADD CONSTRAINT "files_uploadedBy_fkey" FOREIGN KEY ("uploadedBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "files" ADD CONSTRAINT "files_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "file_versions" ADD CONSTRAINT "file_versions_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES "files"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "file_versions" ADD CONSTRAINT "file_versions_modifiedBy_fkey" FOREIGN KEY ("modifiedBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "file_access_logs" ADD CONSTRAINT "file_access_logs_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES "files"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "storage_buckets" ADD CONSTRAINT "storage_buckets_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "backup_metadata" ADD CONSTRAINT "backup_metadata_restoredBy_fkey" FOREIGN KEY ("restoredBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "backup_metadata" ADD CONSTRAINT "backup_metadata_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "backup_metadata" ADD CONSTRAINT "backup_metadata_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_BranchManager" ADD CONSTRAINT "_BranchManager_A_fkey" FOREIGN KEY ("A") REFERENCES "branches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_BranchManager" ADD CONSTRAINT "_BranchManager_B_fkey" FOREIGN KEY ("B") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

