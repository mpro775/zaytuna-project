import { IsEntityId } from '../../../common/decorators/entity-id.decorator';
import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class TransferStockDto {
  @IsNotEmpty({ message: 'معرف المخزن المصدر مطلوب' })
  @IsEntityId()
  fromWarehouseId: string;

  @IsNotEmpty({ message: 'معرف المخزن الوجهة مطلوب' })
  @IsEntityId()
  toWarehouseId: string;

  @IsNotEmpty({ message: 'معرف متغير المنتج مطلوب' })
  @IsEntityId()
  productVariantId: string;

  @IsNotEmpty({ message: 'الكمية مطلوبة' })
  @IsNumber({ maxDecimalPlaces: 3 }, { message: 'الكمية يجب أن تكون رقم' })
  @Min(0.001, { message: 'الكمية يجب أن تكون أكبر من صفر' })
  quantity: number;

  @IsOptional()
  @IsString({ message: 'ملاحظات النقل يجب أن تكون نص' })
  notes?: string;
}
