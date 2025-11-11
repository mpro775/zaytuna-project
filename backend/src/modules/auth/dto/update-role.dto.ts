import { IsOptional, IsString, IsArray, IsBoolean } from 'class-validator';

export class UpdateRoleDto {
  @IsOptional()
  @IsString({ message: 'اسم الدور يجب أن يكون نص' })
  name?: string;

  @IsOptional()
  @IsString({ message: 'وصف الدور يجب أن يكون نص' })
  description?: string;

  @IsOptional()
  @IsArray({ message: 'الصلاحيات يجب أن تكون مصفوفة' })
  @IsString({ each: true, message: 'كل صلاحية يجب أن تكون نص' })
  permissions?: string[];

  @IsOptional()
  @IsBoolean({ message: 'حالة الدور النظامي يجب أن تكون قيمة منطقية' })
  isSystemRole?: boolean;
}
