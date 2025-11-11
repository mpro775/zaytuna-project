import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { CustomerService } from './customer.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { Permissions } from '../../common/decorators/permissions.decorator';

@Controller('customers')
export class CustomerController {
  constructor(private readonly customerService: CustomerService) {}

  /**
   * إنشاء عميل جديد
   */
  @Post()
  @Permissions('customers.create')
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createCustomerDto: CreateCustomerDto) {
    return this.customerService.create(createCustomerDto);
  }

  /**
   * الحصول على العملاء
   */
  @Get()
  @Permissions('customers.read')
  findAll(
    @Query('search') search?: string,
    @Query('isActive') isActive?: string,
    @Query('loyaltyTier') loyaltyTier?: string,
    @Query('limit') limit?: number,
  ) {
    const active = isActive === 'true' ? true : isActive === 'false' ? false : undefined;
    return this.customerService.findAll(
      search,
      active,
      loyaltyTier,
      limit ? parseInt(limit.toString()) : 50,
    );
  }

  /**
   * البحث المتقدم في العملاء
   */
  @Get('search')
  @Permissions('customers.read')
  searchCustomers(
    @Query('query') query: string,
    @Query('loyaltyTier') loyaltyTier?: string,
    @Query('minPurchases') minPurchases?: number,
    @Query('maxPurchases') maxPurchases?: number,
    @Query('hasMarketingConsent') hasMarketingConsent?: string,
    @Query('gender') gender?: string,
    @Query('limit') limit?: number,
  ) {
    const filters = {
      loyaltyTier,
      minPurchases: minPurchases ? parseFloat(minPurchases.toString()) : undefined,
      maxPurchases: maxPurchases ? parseFloat(maxPurchases.toString()) : undefined,
      hasMarketingConsent: hasMarketingConsent === 'true' ? true : hasMarketingConsent === 'false' ? false : undefined,
      gender,
    };

    return this.customerService.searchCustomers(
      query,
      filters,
      limit ? parseInt(limit.toString()) : 50,
    );
  }

  /**
   * الحصول على عميل بالمعرف
   */
  @Get(':id')
  @Permissions('customers.read')
  findOne(@Param('id') id: string) {
    return this.customerService.findOne(id);
  }

  /**
   * تحديث عميل
   */
  @Patch(':id')
  @Permissions('customers.update')
  @HttpCode(HttpStatus.OK)
  update(@Param('id') id: string, @Body() updateCustomerDto: UpdateCustomerDto) {
    return this.customerService.update(id, updateCustomerDto);
  }

  /**
   * حذف عميل
   */
  @Delete(':id')
  @Permissions('customers.delete')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string) {
    return this.customerService.remove(id);
  }

  /**
   * الحصول على إحصائيات الولاء
   */
  @Get(':id/loyalty')
  @Permissions('customers.read')
  getLoyaltyStats(@Param('id') id: string) {
    return this.customerService.getLoyaltyStats(id);
  }

  /**
   * تحديث نقاط الولاء
   */
  @Patch(':id/loyalty-points')
  @Permissions('customers.update')
  @HttpCode(HttpStatus.OK)
  updateLoyaltyPoints(
    @Param('id') id: string,
    @Body('pointsChange') pointsChange: number,
    @Body('reason') reason: string,
  ) {
    return this.customerService.updateLoyaltyPoints(id, pointsChange, reason);
  }

  /**
   * إحصائيات العملاء العامة
   */
  @Get('stats/overview')
  @Permissions('customers.reports')
  getCustomerStats(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;
    return this.customerService.getCustomerStats(start, end);
  }

  /**
   * الحصول على أفضل العملاء
   */
  @Get('stats/top-customers')
  @Permissions('customers.reports')
  getTopCustomers(@Query('limit') limit?: number) {
    // سيتم تنفيذه في Service
    return { message: 'سيتم إضافة هذه الوظيفة قريباً' };
  }

  /**
   * تصدير العملاء
   */
  @Get('export/csv')
  @Permissions('customers.export')
  exportCustomers(@Query('filters') filters?: string) {
    // سيتم تنفيذه في Service
    return { message: 'سيتم إضافة هذه الوظيفة قريباً' };
  }

  /**
   * إرسال رسائل تسويقية
   */
  @Post('marketing/send')
  @Permissions('customers.marketing')
  @HttpCode(HttpStatus.OK)
  sendMarketingMessage(
    @Body('customerIds') customerIds: string[],
    @Body('message') message: string,
    @Body('subject') subject?: string,
  ) {
    // سيتم تنفيذه في Service
    return { message: 'سيتم إضافة هذه الوظيفة قريباً' };
  }
}
