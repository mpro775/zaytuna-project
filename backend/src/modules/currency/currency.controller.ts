import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { CurrencyService } from './currency.service';

@Controller()
export class CurrencyController {
  constructor(private readonly currencyService: CurrencyService) {}

  @Get('currencies')
  @Permissions('currencies.read')
  list() {
    return this.currencyService.list();
  }

  @Post('currencies')
  @Permissions('currencies.create')
  create(@Body() body: any) {
    return this.currencyService.create(body);
  }

  @Get('currencies/:id')
  @Permissions('currencies.read')
  get(@Param('id') id: string) {
    return this.currencyService.get(id);
  }

  @Patch('currencies/:id')
  @Permissions('currencies.update')
  update(@Param('id') id: string, @Body() body: any) {
    return this.currencyService.update(id, body);
  }

  @Delete('currencies/:id')
  @Permissions('currencies.delete')
  delete(@Param('id') id: string) {
    return this.currencyService.delete(id);
  }

  @Post('currencies/:id/set-base')
  @Permissions('currencies.update')
  setBase(@Param('id') id: string) {
    return this.currencyService.setBase(id);
  }

  @Post('currencies/:id/set-default')
  @Permissions('currencies.update')
  setDefault(@Param('id') id: string) {
    return this.currencyService.setDefault(id);
  }

  @Get('exchange-rates')
  @Permissions('exchange-rates.read')
  listExchangeRates() {
    return this.currencyService.listExchangeRates();
  }

  @Post('exchange-rates')
  @Permissions('exchange-rates.create')
  createExchangeRate(@Body() body: any) {
    return this.currencyService.createExchangeRate(body);
  }

  @Get('exchange-rates/latest')
  @Permissions('exchange-rates.read')
  latest(@Query('from') from: string, @Query('to') to: string) {
    return this.currencyService.latest(from, to);
  }

  @Post('exchange-rates/convert')
  @Permissions('exchange-rates.convert')
  convert(@Body() body: any) {
    return this.currencyService.convert(body);
  }
}
