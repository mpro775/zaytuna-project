import { IsOptional, IsString, IsUUID, IsBoolean } from 'class-validator';

export class UpdateCategoryDto {
  @IsOptional()
  @IsString({ message: 'اسم الفئة يجب أن يكون نص' })
  name?: string;

  @IsOptional()
  @IsString({ message: 'وصف الفئة يجب أن يكون نص' })
  description?: string;

  @IsOptional()
  @IsUUID('4', { message: 'معرف الفئة الأب غير صحيح' })
  parentId?: string;

  @IsOptional()
  @IsString({ message: 'رابط الصورة يجب أن يكون نص' })
  imageUrl?: string;

  @IsOptional()
  @IsBoolean({ message: 'حالة النشاط يجب أن تكون قيمة منطقية' })
  isActive?: boolean;
}