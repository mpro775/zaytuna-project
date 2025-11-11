import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  HttpCode,
  HttpStatus,
  Query,
  Delete,
  Req,
} from '@nestjs/common';
import { SalesService } from './sales.service';
import { CreateSalesInvoiceDto } from './dto/create-sales-invoice.dto';
import { UpdateSalesInvoiceDto } from './dto/update-sales-invoice.dto';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { Permissions } from '../../common/decorators/permissions.decorator';

@Controller('sales')
export class SalesController {
  constructor(private readonly salesService: SalesService) {}

  /**
   * إنشاء فاتورة مبيعات جديدة
   */
  @Post('invoices')
  @Permissions('sales.create')
  @HttpCode(HttpStatus.CREATED)
  createInvoice(@Body() createSalesInvoiceDto: CreateSalesInvoiceDto, @Req() req: any) {
    return this.salesService.create(createSalesInvoiceDto, req.user.id);
  }

  /**
   * الحصول على فواتير المبيعات
   */
  @Get('invoices')
  @Permissions('sales.read')
  findAllInvoices(
    @Query('branchId') branchId?: string,
    @Query('customerId') customerId?: string,
    @Query('status') status?: string,
    @Query('paymentStatus') paymentStatus?: string,
    @Query('limit') limit?: number,
  ) {
    return this.salesService.findAll(
      branchId,
      customerId,
      status,
      paymentStatus,
      limit ? parseInt(limit.toString()) : 50,
    );
  }

  /**
   * الحصول على فاتورة مبيعات بالمعرف
   */
  @Get('invoices/:id')
  @Permissions('sales.read')
  findOneInvoice(@Param('id') id: string) {
    return this.salesService.findOne(id);
  }

  /**
   * تحديث فاتورة مبيعات
   */
  @Patch('invoices/:id')
  @Permissions('sales.update')
  @HttpCode(HttpStatus.OK)
  updateInvoice(@Param('id') id: string, @Body() updateSalesInvoiceDto: UpdateSalesInvoiceDto) {
    return this.salesService.update(id, updateSalesInvoiceDto);
  }

  /**
   * إلغاء فاتورة مبيعات
   */
  @Delete('invoices/:id/cancel')
  @Permissions('sales.update')
  @HttpCode(HttpStatus.OK)
  cancelInvoice(
    @Param('id') id: string,
    @Body('reason') reason: string,
    @Req() req: any,
  ) {
    return this.salesService.cancel(id, reason, req.user.id);
  }

  /**
   * إضافة دفعة لفاتورة
   */
  @Post('invoices/:id/payments')
  @Permissions('sales.update')
  @HttpCode(HttpStatus.OK)
  addPayment(
    @Param('id') id: string,
    @Body() createPaymentDto: CreatePaymentDto,
    @Req() req: any,
  ) {
    return this.salesService.addPayment(id, createPaymentDto, req.user.id);
  }

  /**
   * الحصول على إحصائيات المبيعات
   */
  @Get('stats')
  @Permissions('sales.read')
  getSalesStats(
    @Query('branchId') branchId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;
    return this.salesService.getSalesStats(branchId, start, end);
  }

  /**
   * طباعة فاتورة مبيعات
   */
  @Get('invoices/:id/print')
  @Permissions('sales.read')
  async printInvoice(@Param('id') id: string) {
    const invoice = await this.salesService.findOne(id);
    // يمكن إضافة منطق الطباعة هنا
    return {
      ...invoice,
      printData: {
        title: 'فاتورة مبيعات',
        date: new Date().toLocaleDateString('ar-SA'),
        invoice,
      },
    };
  }

  /**
   * الحصول على فواتير العميل
   */
  @Get('customers/:customerId/invoices')
  @Permissions('sales.read')
  getCustomerInvoices(@Param('customerId') customerId: string) {
    return this.salesService.findAll(undefined, customerId);
  }

  /**
   * الحصول على فواتير الفرع
   */
  @Get('branches/:branchId/invoices')
  @Permissions('sales.read')
  getBranchInvoices(@Param('branchId') branchId: string) {
    return this.salesService.findAll(branchId);
  }
}
