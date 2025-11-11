import { IsNotEmpty, IsUUID } from 'class-validator';

export class AssignRoleDto {
  @IsNotEmpty({ message: 'معرف المستخدم مطلوب' })
  @IsUUID('4', { message: 'معرف المستخدم غير صحيح' })
  userId: string;

  @IsNotEmpty({ message: 'معرف الدور مطلوب' })
  @IsUUID('4', { message: 'معرف الدور غير صحيح' })
  roleId: string;
}
