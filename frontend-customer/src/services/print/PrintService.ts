// ============================================
// Print Service - خدمة الطباعة
// ============================================

export interface PrintOptions {
  title?: string;
  orientation?: 'portrait' | 'landscape';
  paperSize?: 'A4' | 'A5' | 'receipt' | 'custom';
  paperWidth?: number;
  paperHeight?: number;
  margins?: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
  showHeader?: boolean;
  showFooter?: boolean;
  copies?: number;
}

export interface InvoicePrintData {
  invoiceNumber: string;
  invoiceDate: string;
  dueDate?: string;
  customer: {
    name: string;
    phone?: string;
    address?: string;
    taxNumber?: string;
  };
  company: {
    name: string;
    logo?: string;
    address: string;
    phone: string;
    email?: string;
    taxNumber?: string;
  };
  items: {
    name: string;
    quantity: number;
    unitPrice: number;
    discount?: number;
    tax?: number;
    total: number;
  }[];
  subtotal: number;
  totalDiscount: number;
  totalTax: number;
  grandTotal: number;
  paidAmount?: number;
  remainingAmount?: number;
  notes?: string;
  terms?: string;
}

export interface ReceiptPrintData {
  receiptNumber: string;
  date: string;
  time: string;
  cashier: string;
  branch: string;
  items: {
    name: string;
    quantity: number;
    price: number;
    total: number;
  }[];
  subtotal: number;
  discount?: number;
  tax?: number;
  grandTotal: number;
  paymentMethod: string;
  paidAmount: number;
  change: number;
  companyName: string;
  companyAddress?: string;
  companyPhone?: string;
  footer?: string;
}

// Format currency for Arabic
const formatCurrency = (amount: number, currency: string = 'ر.ي'): string => {
  return `${amount.toLocaleString('ar-SA', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} ${currency}`;
};

// Format date for Arabic
const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('ar-SA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

// Generate Invoice HTML
export const generateInvoiceHTML = (data: InvoicePrintData, options?: PrintOptions): string => {
  const isA4 = options?.paperSize !== 'receipt';

  return `
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <title>فاتورة ${data.invoiceNumber}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&display=swap');
    
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Cairo', sans-serif;
      font-size: ${isA4 ? '12pt' : '10pt'};
      line-height: 1.5;
      color: #333;
      direction: rtl;
    }
    
    .invoice {
      max-width: ${isA4 ? '210mm' : '80mm'};
      margin: 0 auto;
      padding: ${isA4 ? '20mm' : '5mm'};
      background: white;
    }
    
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 20px;
      padding-bottom: 15px;
      border-bottom: 2px solid #2e7d32;
    }
    
    .company-info {
      flex: 1;
    }
    
    .company-name {
      font-size: ${isA4 ? '24pt' : '14pt'};
      font-weight: 700;
      color: #2e7d32;
      margin-bottom: 5px;
    }
    
    .company-details {
      font-size: ${isA4 ? '10pt' : '8pt'};
      color: #666;
    }
    
    .invoice-title {
      text-align: left;
    }
    
    .invoice-title h1 {
      font-size: ${isA4 ? '28pt' : '16pt'};
      color: #2e7d32;
    }
    
    .invoice-number {
      font-size: ${isA4 ? '14pt' : '10pt'};
      font-weight: 600;
    }
    
    .info-section {
      display: flex;
      justify-content: space-between;
      margin-bottom: 20px;
    }
    
    .customer-info, .invoice-info {
      flex: 1;
      padding: 15px;
      background: #f5f5f5;
      border-radius: 8px;
      margin: 0 5px;
    }
    
    .section-title {
      font-weight: 700;
      color: #2e7d32;
      margin-bottom: 10px;
      font-size: ${isA4 ? '12pt' : '9pt'};
    }
    
    .info-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 5px;
      font-size: ${isA4 ? '10pt' : '8pt'};
    }
    
    .info-label {
      color: #666;
    }
    
    .items-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
    }
    
    .items-table th {
      background: #2e7d32;
      color: white;
      padding: ${isA4 ? '12px' : '8px'};
      text-align: right;
      font-size: ${isA4 ? '11pt' : '8pt'};
    }
    
    .items-table td {
      padding: ${isA4 ? '10px' : '6px'};
      border-bottom: 1px solid #eee;
      font-size: ${isA4 ? '10pt' : '8pt'};
    }
    
    .items-table tr:nth-child(even) {
      background: #f9f9f9;
    }
    
    .totals {
      width: ${isA4 ? '300px' : '100%'};
      margin-right: auto;
      margin-left: 0;
    }
    
    .total-row {
      display: flex;
      justify-content: space-between;
      padding: 8px 15px;
      border-bottom: 1px solid #eee;
    }
    
    .total-row.grand-total {
      background: #2e7d32;
      color: white;
      font-size: ${isA4 ? '14pt' : '11pt'};
      font-weight: 700;
      border-radius: 4px;
      margin-top: 10px;
    }
    
    .notes {
      margin-top: 20px;
      padding: 15px;
      background: #fff3e0;
      border-radius: 8px;
      border-right: 4px solid #f57c00;
    }
    
    .footer {
      margin-top: 30px;
      text-align: center;
      font-size: ${isA4 ? '9pt' : '7pt'};
      color: #666;
      padding-top: 15px;
      border-top: 1px solid #ddd;
    }
    
    @media print {
      body {
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
      
      .invoice {
        padding: 0;
      }
    }
  </style>
</head>
<body>
  <div class="invoice">
    <!-- Header -->
    <div class="header">
      <div class="company-info">
        <div class="company-name">${data.company.name}</div>
        <div class="company-details">
          ${data.company.address}<br>
          ${data.company.phone}
          ${data.company.email ? `<br>${data.company.email}` : ''}
          ${data.company.taxNumber ? `<br>الرقم الضريبي: ${data.company.taxNumber}` : ''}
        </div>
      </div>
      <div class="invoice-title">
        <h1>فاتورة</h1>
        <div class="invoice-number">#${data.invoiceNumber}</div>
      </div>
    </div>
    
    <!-- Info Section -->
    <div class="info-section">
      <div class="customer-info">
        <div class="section-title">معلومات العميل</div>
        <div class="info-row">
          <span class="info-label">الاسم:</span>
          <span>${data.customer.name}</span>
        </div>
        ${data.customer.phone ? `
        <div class="info-row">
          <span class="info-label">الهاتف:</span>
          <span>${data.customer.phone}</span>
        </div>
        ` : ''}
        ${data.customer.address ? `
        <div class="info-row">
          <span class="info-label">العنوان:</span>
          <span>${data.customer.address}</span>
        </div>
        ` : ''}
      </div>
      <div class="invoice-info">
        <div class="section-title">معلومات الفاتورة</div>
        <div class="info-row">
          <span class="info-label">تاريخ الفاتورة:</span>
          <span>${formatDate(data.invoiceDate)}</span>
        </div>
        ${data.dueDate ? `
        <div class="info-row">
          <span class="info-label">تاريخ الاستحقاق:</span>
          <span>${formatDate(data.dueDate)}</span>
        </div>
        ` : ''}
      </div>
    </div>
    
    <!-- Items Table -->
    <table class="items-table">
      <thead>
        <tr>
          <th>#</th>
          <th>الصنف</th>
          <th>الكمية</th>
          <th>السعر</th>
          ${data.items.some(i => i.discount) ? '<th>الخصم</th>' : ''}
          ${data.items.some(i => i.tax) ? '<th>الضريبة</th>' : ''}
          <th>الإجمالي</th>
        </tr>
      </thead>
      <tbody>
        ${data.items.map((item, index) => `
        <tr>
          <td>${index + 1}</td>
          <td>${item.name}</td>
          <td>${item.quantity}</td>
          <td>${formatCurrency(item.unitPrice)}</td>
          ${item.discount ? `<td>${formatCurrency(item.discount)}</td>` : ''}
          ${item.tax ? `<td>${formatCurrency(item.tax)}</td>` : ''}
          <td>${formatCurrency(item.total)}</td>
        </tr>
        `).join('')}
      </tbody>
    </table>
    
    <!-- Totals -->
    <div class="totals">
      <div class="total-row">
        <span>المجموع الفرعي:</span>
        <span>${formatCurrency(data.subtotal)}</span>
      </div>
      ${data.totalDiscount > 0 ? `
      <div class="total-row">
        <span>الخصم:</span>
        <span style="color: #4caf50;">-${formatCurrency(data.totalDiscount)}</span>
      </div>
      ` : ''}
      ${data.totalTax > 0 ? `
      <div class="total-row">
        <span>الضريبة:</span>
        <span>${formatCurrency(data.totalTax)}</span>
      </div>
      ` : ''}
      <div class="total-row grand-total">
        <span>الإجمالي النهائي:</span>
        <span>${formatCurrency(data.grandTotal)}</span>
      </div>
      ${data.paidAmount !== undefined ? `
      <div class="total-row">
        <span>المدفوع:</span>
        <span>${formatCurrency(data.paidAmount)}</span>
      </div>
      ` : ''}
      ${data.remainingAmount !== undefined && data.remainingAmount > 0 ? `
      <div class="total-row">
        <span>المتبقي:</span>
        <span style="color: #f44336;">${formatCurrency(data.remainingAmount)}</span>
      </div>
      ` : ''}
    </div>
    
    <!-- Notes -->
    ${data.notes ? `
    <div class="notes">
      <div class="section-title">ملاحظات</div>
      ${data.notes}
    </div>
    ` : ''}
    
    <!-- Footer -->
    <div class="footer">
      ${data.terms || 'شكراً لتعاملكم معنا'}
    </div>
  </div>
</body>
</html>
  `;
};

// Generate Receipt HTML (Thermal Printer)
export const generateReceiptHTML = (data: ReceiptPrintData): string => {
  return `
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <title>إيصال ${data.receiptNumber}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&display=swap');
    
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Cairo', monospace;
      font-size: 10pt;
      line-height: 1.3;
      width: 80mm;
      padding: 5mm;
      direction: rtl;
    }
    
    .receipt {
      width: 100%;
    }
    
    .header {
      text-align: center;
      margin-bottom: 10px;
      padding-bottom: 10px;
      border-bottom: 1px dashed #000;
    }
    
    .company-name {
      font-size: 14pt;
      font-weight: 700;
    }
    
    .info {
      font-size: 8pt;
      margin-top: 5px;
    }
    
    .meta {
      display: flex;
      justify-content: space-between;
      font-size: 8pt;
      margin-bottom: 10px;
      padding-bottom: 5px;
      border-bottom: 1px dashed #000;
    }
    
    .items {
      margin-bottom: 10px;
      padding-bottom: 10px;
      border-bottom: 1px dashed #000;
    }
    
    .item {
      display: flex;
      justify-content: space-between;
      margin-bottom: 3px;
      font-size: 9pt;
    }
    
    .item-name {
      flex: 2;
    }
    
    .item-qty, .item-price {
      flex: 1;
      text-align: left;
    }
    
    .totals {
      margin-bottom: 10px;
      padding-bottom: 10px;
      border-bottom: 1px dashed #000;
    }
    
    .total-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 3px;
    }
    
    .grand-total {
      font-size: 12pt;
      font-weight: 700;
    }
    
    .payment {
      margin-bottom: 10px;
      padding-bottom: 10px;
      border-bottom: 1px dashed #000;
    }
    
    .footer {
      text-align: center;
      font-size: 8pt;
    }
    
    .barcode {
      text-align: center;
      margin: 10px 0;
      font-family: 'Libre Barcode 39', cursive;
      font-size: 24pt;
    }
    
    @media print {
      body {
        width: 80mm;
        margin: 0;
        padding: 2mm;
      }
    }
  </style>
</head>
<body>
  <div class="receipt">
    <!-- Header -->
    <div class="header">
      <div class="company-name">${data.companyName}</div>
      ${data.companyAddress ? `<div class="info">${data.companyAddress}</div>` : ''}
      ${data.companyPhone ? `<div class="info">${data.companyPhone}</div>` : ''}
    </div>
    
    <!-- Meta Info -->
    <div class="meta">
      <div>
        <div>رقم: ${data.receiptNumber}</div>
        <div>الفرع: ${data.branch}</div>
      </div>
      <div style="text-align: left;">
        <div>${data.date}</div>
        <div>${data.time}</div>
      </div>
    </div>
    
    <!-- Items -->
    <div class="items">
      ${data.items.map(item => `
      <div class="item">
        <span class="item-name">${item.name}</span>
        <span class="item-qty">×${item.quantity}</span>
        <span class="item-price">${formatCurrency(item.total)}</span>
      </div>
      `).join('')}
    </div>
    
    <!-- Totals -->
    <div class="totals">
      <div class="total-row">
        <span>المجموع:</span>
        <span>${formatCurrency(data.subtotal)}</span>
      </div>
      ${data.discount ? `
      <div class="total-row">
        <span>الخصم:</span>
        <span>-${formatCurrency(data.discount)}</span>
      </div>
      ` : ''}
      ${data.tax ? `
      <div class="total-row">
        <span>الضريبة:</span>
        <span>${formatCurrency(data.tax)}</span>
      </div>
      ` : ''}
      <div class="total-row grand-total">
        <span>الإجمالي:</span>
        <span>${formatCurrency(data.grandTotal)}</span>
      </div>
    </div>
    
    <!-- Payment -->
    <div class="payment">
      <div class="total-row">
        <span>طريقة الدفع:</span>
        <span>${data.paymentMethod}</span>
      </div>
      <div class="total-row">
        <span>المدفوع:</span>
        <span>${formatCurrency(data.paidAmount)}</span>
      </div>
      ${data.change > 0 ? `
      <div class="total-row">
        <span>الباقي:</span>
        <span>${formatCurrency(data.change)}</span>
      </div>
      ` : ''}
    </div>
    
    <!-- Footer -->
    <div class="footer">
      <div>الكاشير: ${data.cashier}</div>
      <div style="margin-top: 10px;">${data.footer || 'شكراً لزيارتكم'}</div>
    </div>
  </div>
</body>
</html>
  `;
};

// Print function
export const printDocument = (html: string): void => {
  const printWindow = window.open('', '_blank', 'width=800,height=600');
  
  if (printWindow) {
    printWindow.document.write(html);
    printWindow.document.close();
    
    // Wait for content to load then print
    printWindow.onload = () => {
      printWindow.focus();
      printWindow.print();
      
      // Close window after printing (optional)
      // printWindow.close();
    };
  }
};

// Print Invoice
export const printInvoice = (data: InvoicePrintData, options?: PrintOptions): void => {
  const html = generateInvoiceHTML(data, options);
  printDocument(html);
};

// Print Receipt
export const printReceipt = (data: ReceiptPrintData): void => {
  const html = generateReceiptHTML(data);
  printDocument(html);
};

// Export as PDF (using browser's print to PDF)
export const exportToPDF = (html: string): void => {
  printDocument(html);
};

export default {
  generateInvoiceHTML,
  generateReceiptHTML,
  printDocument,
  printInvoice,
  printReceipt,
  exportToPDF,
};
