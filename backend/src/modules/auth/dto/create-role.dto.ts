import { IsNotEmpty, IsString, IsOptional, IsArray, IsBoolean, MaxLength } from 'class-validator';

export class CreateRoleDto {
  @IsNotEmpty({ message: 'اسم الدور مطلوب' })
  @IsString({ message: 'اسم الدور يجب أن يكون نص' })
  @MaxLength(50, { message: 'اسم الدور يجب ألا يزيد عن 50 حرف' })
  name: string;

  @IsOptional()
  @IsString({ message: 'وصف الدور يجب أن يكون نص' })
  @MaxLength(200, { message: 'وصف الدور يجب ألا يزيد عن 200 حرف' })
  description?: string;

  @IsOptional()
  @IsArray({ message: 'الصلاحيات يجب أن تكون مصفوفة' })
  @IsString({ each: true, message: 'كل صلاحية يجب أن تكون نص' })
  permissions?: string[];

  @IsOptional()
  @IsBoolean({ message: 'حالة الدور النظامي يجب أن تكون قيمة منطقية' })
  isSystemRole?: boolean;
}
