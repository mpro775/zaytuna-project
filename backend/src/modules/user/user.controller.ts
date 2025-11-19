import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpCode,
  HttpStatus,
  Query,
  Put,
} from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ChangeUserPasswordDto } from './dto/change-user-password.dto';
import { Permissions } from '../../common/decorators/permissions.decorator';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  /**
   * إنشاء مستخدم جديد
   */
  @Post()
  @Permissions('users.create')
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createUserDto: CreateUserDto) {
    return this.userService.create(createUserDto);
  }

  /**
   * الحصول على جميع المستخدمين
   */
  @Get()
  @Permissions('users.read')
  findAll(
    @Query('branchId') branchId?: string,
    @Query('roleId') roleId?: string,
    @Query('isActive') isActive?: string,
  ) {
    const filters: any = {};

    if (branchId) filters.branchId = branchId;
    if (roleId) filters.roleId = roleId;
    if (isActive !== undefined) filters.isActive = isActive === 'true';

    return this.userService.findAll(filters);
  }

  /**
   * الحصول على مستخدم بالمعرف
   */
  @Get(':id')
  @Permissions('users.read')
  findOne(@Param('id') id: string) {
    return this.userService.findOne(id);
  }

  /**
   * تحديث مستخدم
   */
  @Patch(':id')
  @Permissions('users.update')
  @HttpCode(HttpStatus.OK)
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.userService.update(id, updateUserDto);
  }

  /**
   * حذف مستخدم
   */
  @Delete(':id')
  @Permissions('users.delete')
  @HttpCode(HttpStatus.OK)
  remove(@Param('id') id: string) {
    return this.userService.remove(id);
  }

  /**
   * تغيير كلمة مرور المستخدم
   */
  @Patch(':id/password')
  @Permissions('users.update')
  @HttpCode(HttpStatus.OK)
  changePassword(
    @Param('id') id: string,
    @Body() changePasswordDto: ChangeUserPasswordDto,
  ) {
    return this.userService.changePassword(id, changePasswordDto);
  }

  /**
   * تبديل حالة المستخدم (تفعيل/إلغاء تفعيل)
   */
  @Put(':id/toggle-status')
  @Permissions('users.update')
  @HttpCode(HttpStatus.OK)
  toggleStatus(@Param('id') id: string) {
    return this.userService.toggleUserStatus(id);
  }

  /**
   * الحصول على إحصائيات المستخدمين
   */
  @Get('stats/overview')
  @Permissions('users.read')
  getUserStats() {
    return this.userService.getUserStats();
  }
}
