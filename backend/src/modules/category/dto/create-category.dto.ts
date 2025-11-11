import { IsNotEmpty, IsString, IsOptional, IsUUID, IsBoolean, MaxLength } from 'class-validator';

export class CreateCategoryDto {
  @IsNotEmpty({ message: 'اسم الفئة مطلوب' })
  @IsString({ message: 'اسم الفئة يجب أن يكون نص' })
  @MaxLength(255, { message: 'اسم الفئة يجب ألا يزيد عن 255 حرف' })
  name: string;

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
