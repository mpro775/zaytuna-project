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
} from '@nestjs/common';
import { ReturnsService } from './returns.service';
import { CreateReturnDto } from './dto/create-return.dto';
import { UpdateReturnDto } from './dto/update-return.dto';
import { CreateCreditNoteDto } from './dto/create-credit-note.dto';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { Req } from '@nestjs/common';

@Controller('returns')
export class ReturnsController {
  constructor(private readonly returnsService: ReturnsService) {}

  /**
   * إنشاء مرتجع جديد
   */
  @Post()
  @Permissions('returns.create')
  @HttpCode(HttpStatus.CREATED)
  createReturn(@Body() createReturnDto: CreateReturnDto, @Req() req: any) {
    return this.returnsService.create(createReturnDto, req.user.id);
  }

  /**
   * الحصول على المرتجعات
   */
  @Get()
  @Permissions('returns.read')
  findAllReturns(
    @Query('salesInvoiceId') salesInvoiceId?: string,
    @Query('customerId') customerId?: string,
    @Query('status') status?: string,
    @Query('refundStatus') refundStatus?: string,
    @Query('limit') limit?: number,
  ) {
    return this.returnsService.findAll(
      salesInvoiceId,
      customerId,
      status,
      refundStatus,
      limit ? parseInt(limit.toString()) : 50,
    );
  }

  /**
   * الحصول على مرتجع بالمعرف
   */
  @Get(':id')
  @Permissions('returns.read')
  findOneReturn(@Param('id') id: string) {
    return this.returnsService.findOne(id);
  }

  /**
   * تحديث مرتجع
   */
  @Patch(':id')
  @Permissions('returns.update')
  @HttpCode(HttpStatus.OK)
  updateReturn(@Param('id') id: string, @Body() updateReturnDto: UpdateReturnDto) {
    return this.returnsService.update(id, updateReturnDto);
  }

  /**
   * إلغاء مرتجع
   */
  @Delete(':id/cancel')
  @Permissions('returns.update')
  @HttpCode(HttpStatus.OK)
  cancelReturn(
    @Param('id') id: string,
    @Body('reason') reason: string,
    @Req() req: any,
  ) {
    return this.returnsService.cancel(id, reason, req.user.id);
  }

  /**
   * إنشاء إشعار دائن
   */
  @Post(':id/credit-notes')
  @Permissions('returns.update')
  @HttpCode(HttpStatus.CREATED)
  createCreditNote(
    @Param('id') id: string,
    @Body() createCreditNoteDto: CreateCreditNoteDto,
    @Req() req: any,
  ) {
    return this.returnsService.createCreditNote(id, createCreditNoteDto, req.user.id);
  }

  /**
   * الحصول على إحصائيات المرتجعات
   */
  @Get('stats/overview')
  @Permissions('returns.read')
  getReturnsStats(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;
    return this.returnsService.getReturnsStats(start, end);
  }

  /**
   * الحصول على مرتجعات فاتورة مبيعات
   */
  @Get('sales-invoices/:salesInvoiceId/returns')
  @Permissions('returns.read')
  getSalesInvoiceReturns(@Param('salesInvoiceId') salesInvoiceId: string) {
    return this.returnsService.findAll(salesInvoiceId);
  }

  /**
   * الحصول على مرتجعات العميل
   */
  @Get('customers/:customerId/returns')
  @Permissions('returns.read')
  getCustomerReturns(@Param('customerId') customerId: string) {
    return this.returnsService.findAll(undefined, customerId);
  }
}
