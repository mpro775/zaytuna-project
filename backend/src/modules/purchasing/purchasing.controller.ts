import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpCode,
  HttpStatus,
  Query,
} from '@nestjs/common';
import { PurchasingService } from './purchasing.service';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { UpdateSupplierDto } from './dto/update-supplier.dto';
import { CreatePurchaseOrderDto } from './dto/create-purchase-order.dto';
import { CreatePurchaseInvoiceDto } from './dto/create-purchase-invoice.dto';
import { CreatePurchasePaymentDto } from './dto/create-purchase-payment.dto';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { Req } from '@nestjs/common';

@Controller('purchasing')
export class PurchasingController {
  constructor(private readonly purchasingService: PurchasingService) {}

  // ========== SUPPLIERS ENDPOINTS ==========

  /**
   * إنشاء مورد جديد
   */
  @Post('suppliers')
  @Permissions('purchasing.suppliers.create')
  @HttpCode(HttpStatus.CREATED)
  createSupplier(@Body() createSupplierDto: CreateSupplierDto) {
    return this.purchasingService.createSupplier(createSupplierDto);
  }

  /**
   * الحصول على الموردين
   */
  @Get('suppliers')
  @Permissions('purchasing.suppliers.read')
  findAllSuppliers(
    @Query('search') search?: string,
    @Query('isActive') isActive?: string,
    @Query('limit') limit?: number,
  ) {
    const active = isActive === 'true' ? true : isActive === 'false' ? false : undefined;
    return this.purchasingService.findAllSuppliers(
      search,
      active,
      limit ? parseInt(limit.toString()) : 50,
    );
  }

  /**
   * الحصول على مورد بالمعرف
   */
  @Get('suppliers/:id')
  @Permissions('purchasing.suppliers.read')
  findOneSupplier(@Param('id') id: string) {
    return this.purchasingService.findOneSupplier(id);
  }

  /**
   * تحديث مورد
   */
  @Patch('suppliers/:id')
  @Permissions('purchasing.suppliers.update')
  @HttpCode(HttpStatus.OK)
  updateSupplier(@Param('id') id: string, @Body() updateSupplierDto: UpdateSupplierDto) {
    return this.purchasingService.updateSupplier(id, updateSupplierDto);
  }

  /**
   * حذف مورد
   */
  @Delete('suppliers/:id')
  @Permissions('purchasing.suppliers.delete')
  @HttpCode(HttpStatus.NO_CONTENT)
  removeSupplier(@Param('id') id: string) {
    return this.purchasingService.removeSupplier(id);
  }

  // ========== PURCHASE ORDERS ENDPOINTS ==========

  /**
   * إنشاء أمر شراء جديد
   */
  @Post('orders')
  @Permissions('purchasing.orders.create')
  @HttpCode(HttpStatus.CREATED)
  createPurchaseOrder(@Body() createPurchaseOrderDto: CreatePurchaseOrderDto, @Req() req: any) {
    return this.purchasingService.createPurchaseOrder(createPurchaseOrderDto, req.user.id);
  }

  /**
   * الحصول على أوامر الشراء
   */
  @Get('orders')
  @Permissions('purchasing.orders.read')
  findAllPurchaseOrders(
    @Query('supplierId') supplierId?: string,
    @Query('status') status?: string,
    @Query('limit') limit?: number,
  ) {
    return this.purchasingService.findAllPurchaseOrders(
      supplierId,
      status,
      limit ? parseInt(limit.toString()) : 50,
    );
  }

  /**
   * تحديث حالة أمر الشراء
   */
  @Patch('orders/:id/status')
  @Permissions('purchasing.orders.update')
  @HttpCode(HttpStatus.OK)
  updatePurchaseOrderStatus(
    @Param('id') id: string,
    @Body('status') status: string,
    @Req() req: any,
  ) {
    return this.purchasingService.updatePurchaseOrderStatus(id, status, req.user.id);
  }

  // ========== PURCHASE INVOICES ENDPOINTS ==========

  /**
   * إنشاء فاتورة شراء جديدة
   */
  @Post('invoices')
  @Permissions('purchasing.invoices.create')
  @HttpCode(HttpStatus.CREATED)
  createPurchaseInvoice(@Body() createPurchaseInvoiceDto: CreatePurchaseInvoiceDto, @Req() req: any) {
    return this.purchasingService.createPurchaseInvoice(createPurchaseInvoiceDto, req.user.id);
  }

  /**
   * إنشاء دفعة لفاتورة شراء
   */
  @Post('invoices/:id/payments')
  @Permissions('purchasing.payments.create')
  @HttpCode(HttpStatus.CREATED)
  createPurchasePayment(
    @Param('id') id: string,
    @Body() createPurchasePaymentDto: CreatePurchasePaymentDto,
    @Req() req: any,
  ) {
    return this.purchasingService.createPurchasePayment(id, createPurchasePaymentDto, req.user.id);
  }

  // ========== REPORTING ENDPOINTS ==========

  /**
   * إحصائيات المشتريات
   */
  @Get('stats/overview')
  @Permissions('purchasing.reports.read')
  getPurchasingStats(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;
    return this.purchasingService.getPurchasingStats(start, end);
  }

  // ========== FILTERED ENDPOINTS ==========

  /**
   * أوامر الشراء لمورد محدد
   */
  @Get('suppliers/:supplierId/orders')
  @Permissions('purchasing.orders.read')
  getSupplierPurchaseOrders(@Param('supplierId') supplierId: string) {
    return this.purchasingService.findAllPurchaseOrders(supplierId);
  }

  /**
   * فواتير الشراء لمورد محدد
   */
  @Get('suppliers/:supplierId/invoices')
  @Permissions('purchasing.invoices.read')
  getSupplierPurchaseInvoices(@Param('supplierId') supplierId: string) {
    // سيتم إضافة هذه الوظيفة في Service لاحقاً
    return { message: 'سيتم إضافة هذه الوظيفة قريباً' };
  }
}
