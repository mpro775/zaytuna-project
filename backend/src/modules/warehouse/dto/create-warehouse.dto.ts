import { IsNotEmpty, IsString, IsOptional, IsEmail, IsUUID, IsBoolean, MaxLength } from 'class-validator';

export class CreateWarehouseDto {
  @IsNotEmpty({ message: 'اسم المخزن مطلوب' })
  @IsString({ message: 'اسم المخزن يجب أن يكون نص' })
  @MaxLength(255, { message: 'اسم المخزن يجب ألا يزيد عن 255 حرف' })
  name: string;

  @IsNotEmpty({ message: 'كود المخزن مطلوب' })
  @IsString({ message: 'كود المخزن يجب أن يكون نص' })
  @MaxLength(50, { message: 'كود المخزن يجب ألا يزيد عن 50 حرف' })
  code: string;

  @IsOptional()
  @IsString({ message: 'العنوان يجب أن يكون نص' })
  address?: string;

  @IsOptional()
  @IsString({ message: 'رقم الهاتف يجب أن يكون نص' })
  @MaxLength(50, { message: 'رقم الهاتف يجب ألا يزيد عن 50 حرف' })
  phone?: string;

  @IsOptional()
  @IsEmail({}, { message: 'البريد الإلكتروني غير صحيح' })
  email?: string;

  @IsNotEmpty({ message: 'معرف الفرع مطلوب' })
  @IsUUID('4', { message: 'معرف الفرع غير صحيح' })
  branchId: string;

  @IsOptional()
  @IsUUID('4', { message: 'معرف المدير غير صحيح' })
  managerId?: string;

  @IsOptional()
  @IsBoolean({ message: 'حالة النشاط يجب أن تكون قيمة منطقية' })
  isActive?: boolean;
}
