import { IsEntityId } from '../../../common/decorators/entity-id.decorator';
import { IsOptional, IsString, IsEmail, IsBoolean } from 'class-validator';

export class UpdateWarehouseDto {
  @IsOptional()
  @IsString({ message: 'اسم المخزن يجب أن يكون نص' })
  name?: string;

  @IsOptional()
  @IsString({ message: 'كود المخزن يجب أن يكون نص' })
  code?: string;

  @IsOptional()
  @IsString({ message: 'العنوان يجب أن يكون نص' })
  address?: string;

  @IsOptional()
  @IsString({ message: 'رقم الهاتف يجب أن يكون نص' })
  phone?: string;

  @IsOptional()
  @IsEmail({}, { message: 'البريد الإلكتروني غير صحيح' })
  email?: string;

  @IsOptional()
  @IsEntityId()
  managerId?: string;

  @IsOptional()
  @IsBoolean({ message: 'حالة النشاط يجب أن تكون قيمة منطقية' })
  isActive?: boolean;
}
