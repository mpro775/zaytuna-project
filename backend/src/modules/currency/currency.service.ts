import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../shared/database/prisma.service';

@Injectable()
export class CurrencyService {
  constructor(private readonly prisma: PrismaService) {}

  list() {
    return this.prisma.currency.findMany({ orderBy: { code: 'asc' } });
  }

  async create(dto: any) {
    const code = this.normalizeCode(dto.code);
    if (!dto.name) throw new BadRequestException('Currency name is required');

    return this.prisma.$transaction(async (tx) => {
      if (dto.isBase)
        await tx.currency.updateMany({
          where: { isBase: true },
          data: { isBase: false },
        });
      if (dto.isDefault)
        await tx.currency.updateMany({
          where: { isDefault: true },
          data: { isDefault: false },
        });

      return tx.currency.create({
        data: {
          code,
          name: dto.name,
          symbol: dto.symbol,
          decimalPlaces: dto.decimalPlaces ?? 2,
          exchangeRate: dto.exchangeRate ?? 1,
          isBase: dto.isBase ?? false,
          isDefault: dto.isDefault ?? false,
          isActive: dto.isActive ?? true,
        },
      });
    });
  }

  async get(id: string) {
    const currency = await this.prisma.currency.findUnique({ where: { id } });
    if (!currency) throw new NotFoundException('Currency not found');
    return currency;
  }

  async update(id: string, dto: any) {
    await this.get(id);
    return this.prisma.$transaction(async (tx) => {
      if (dto.isBase)
        await tx.currency.updateMany({
          where: { isBase: true },
          data: { isBase: false },
        });
      if (dto.isDefault)
        await tx.currency.updateMany({
          where: { isDefault: true },
          data: { isDefault: false },
        });

      return tx.currency.update({
        where: { id },
        data: {
          ...dto,
          code: dto.code ? this.normalizeCode(dto.code) : undefined,
        },
      });
    });
  }

  async delete(id: string) {
    const currency = await this.get(id);
    if (currency.isBase)
      throw new BadRequestException('Cannot delete base currency');

    const usage = await Promise.all([
      this.prisma.salesInvoice.count({ where: { currencyId: id } }),
      this.prisma.payment.count({ where: { currencyId: id } }),
      this.prisma.purchaseInvoice.count({ where: { currencyId: id } }),
    ]);
    if (usage.some((count) => count > 0)) {
      throw new BadRequestException(
        'Cannot delete currency used in financial documents',
      );
    }

    await this.prisma.currency.delete({ where: { id } });
    return { id, deleted: true };
  }

  async setBase(id: string) {
    await this.get(id);
    return this.prisma.$transaction(async (tx) => {
      await tx.currency.updateMany({
        where: { isBase: true },
        data: { isBase: false },
      });
      await tx.currency.updateMany({
        where: { isDefault: true },
        data: { isDefault: false },
      });
      return tx.currency.update({
        where: { id },
        data: { isBase: true, isDefault: true },
      });
    });
  }

  async setDefault(id: string) {
    await this.get(id);
    return this.prisma.$transaction(async (tx) => {
      await tx.currency.updateMany({
        where: { isDefault: true },
        data: { isDefault: false },
      });
      return tx.currency.update({ where: { id }, data: { isDefault: true } });
    });
  }

  listExchangeRates() {
    return this.prisma.exchangeRate.findMany({
      include: { fromCurrency: true, toCurrency: true },
      orderBy: { effectiveAt: 'desc' },
    });
  }

  async createExchangeRate(dto: any) {
    const rate = new Prisma.Decimal(dto.rate);
    if (rate.lte(0))
      throw new BadRequestException('Exchange rate must be positive');
    await this.get(dto.fromCurrencyId);
    await this.get(dto.toCurrencyId);

    return this.prisma.exchangeRate.create({
      data: {
        fromCurrencyId: dto.fromCurrencyId,
        toCurrencyId: dto.toCurrencyId,
        rate,
        effectiveAt: dto.effectiveAt ? new Date(dto.effectiveAt) : new Date(),
        source: dto.source ?? 'manual',
        notes: dto.notes,
        createdBy: dto.createdBy,
      },
    });
  }

  async latest(from: string, to: string) {
    const fromCurrency = await this.findByCodeOrId(from);
    const toCurrency = await this.findByCodeOrId(to);
    if (fromCurrency.id === toCurrency.id) {
      return {
        fromCurrency,
        toCurrency,
        rate: new Prisma.Decimal(1),
        effectiveAt: new Date(),
      };
    }

    const rate = await this.prisma.exchangeRate.findFirst({
      where: { fromCurrencyId: fromCurrency.id, toCurrencyId: toCurrency.id },
      orderBy: { effectiveAt: 'desc' },
    });
    if (!rate) throw new NotFoundException('Exchange rate not found');
    return rate;
  }

  async convert(dto: any) {
    const amount = new Prisma.Decimal(dto.amount);
    const fromCurrency = await this.findByCodeOrId(
      dto.fromCurrencyId ?? dto.from,
    );
    const toCurrency = await this.findByCodeOrId(dto.toCurrencyId ?? dto.to);
    if (fromCurrency.id === toCurrency.id) {
      return { amount, convertedAmount: amount, rate: new Prisma.Decimal(1) };
    }
    const rate = (await this.latest(fromCurrency.id, toCurrency.id)) as any;
    return {
      amount,
      convertedAmount: amount.mul(rate.rate),
      rate: rate.rate,
      fromCurrency,
      toCurrency,
    };
  }

  private async findByCodeOrId(value: string) {
    const currency = await this.prisma.currency.findFirst({
      where: { OR: [{ id: value }, { code: this.normalizeCode(value) }] },
    });
    if (!currency) throw new NotFoundException(`Currency not found: ${value}`);
    return currency;
  }

  private normalizeCode(code: string) {
    if (!code || typeof code !== 'string')
      throw new BadRequestException('Currency code is required');
    return code.trim().toUpperCase();
  }

  private clearBaseCurrency() {
    return this.prisma.currency.updateMany({
      where: { isBase: true },
      data: { isBase: false },
    });
  }

  private clearDefaultCurrency() {
    return this.prisma.currency.updateMany({
      where: { isDefault: true },
      data: { isDefault: false },
    });
  }
}
