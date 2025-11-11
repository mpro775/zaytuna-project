import { IsNotEmpty, IsString, IsOptional, IsBoolean, IsEmail, IsDateString, IsNumber, Min } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateCustomerDto {
  @IsNotEmpty({ message: 'اسم العميل مطلوب' })
  @IsString({ message: 'اسم العميل يجب أن يكون نص' })
  name: string;

  @IsOptional()
  @IsString({ message: 'رقم الهاتف يجب أن يكون نص' })
  phone?: string;

  @IsOptional()
  @IsEmail({}, { message: 'البريد الإلكتروني غير صحيح' })
  email?: string;

  @IsOptional()
  @IsString({ message: 'العنوان يجب أن يكون نص' })
  address?: string;

  @IsOptional()
  @IsString({ message: 'الرقم الضريبي يجب أن يكون نص' })
  taxNumber?: string;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'حد الائتمان يجب أن يكون رقم' })
  @Min(0, { message: 'حد الائتمان يجب أن يكون موجب' })
  @Transform(({ value }) => value ? parseFloat(value) : undefined)
  creditLimit?: number;

  @IsOptional()
  @IsDateString({}, { message: 'تاريخ الميلاد غير صحيح' })
  birthday?: string;

  @IsOptional()
  @IsString({ message: 'الجنس يجب أن يكون نص' })
  gender?: string; // male, female, other

  @IsOptional()
  @IsBoolean({ message: 'موافقة التسويق يجب أن تكون منطقية' })
  marketingConsent?: boolean;

  @IsOptional()
  @IsBoolean({ message: 'حالة النشاط يجب أن تكون منطقية' })
  isActive?: boolean;
}
