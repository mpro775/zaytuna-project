import { IsEntityId } from '../../../common/decorators/entity-id.decorator';
import { IsNotEmpty } from 'class-validator';

export class AssignRoleDto {
  @IsNotEmpty({ message: 'معرف المستخدم مطلوب' })
  @IsEntityId()
  userId: string;

  @IsNotEmpty({ message: 'معرف الدور مطلوب' })
  @IsEntityId()
  roleId: string;
}
