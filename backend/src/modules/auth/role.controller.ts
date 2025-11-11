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
} from '@nestjs/common';
import { RoleService } from './role.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { AssignRoleDto } from './dto/assign-role.dto';
import { Permissions } from '../../common/decorators/permissions.decorator';

@Controller('roles')
export class RoleController {
  constructor(private readonly roleService: RoleService) {}

  /**
   * إنشاء دور جديد
   */
  @Post()
  @Permissions('roles.create')
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createRoleDto: CreateRoleDto) {
    return this.roleService.create(createRoleDto);
  }

  /**
   * الحصول على جميع الأدوار
   */
  @Get()
  @Permissions('roles.read')
  findAll() {
    return this.roleService.findAll();
  }

  /**
   * الحصول على إحصائيات الأدوار
   */
  @Get('stats')
  @Permissions('roles.read')
  getRoleStats() {
    return this.roleService.getRoleStats();
  }

  /**
   * الحصول على دور بالمعرف
   */
  @Get(':id')
  @Permissions('roles.read')
  findOne(@Param('id') id: string) {
    return this.roleService.findOne(id);
  }

  /**
   * الحصول على المستخدمين بالدور
   */
  @Get(':id/users')
  @Permissions('users.read')
  getUsersByRole(@Param('id') id: string) {
    return this.roleService.getUsersByRole(id);
  }

  /**
   * تحديث دور
   */
  @Patch(':id')
  @Permissions('roles.update')
  @HttpCode(HttpStatus.OK)
  update(@Param('id') id: string, @Body() updateRoleDto: UpdateRoleDto) {
    return this.roleService.update(id, updateRoleDto);
  }

  /**
   * تعيين دور لمستخدم
   */
  @Post('assign')
  @Permissions('roles.assign')
  @HttpCode(HttpStatus.OK)
  assignRoleToUser(@Body() assignRoleDto: AssignRoleDto) {
    return this.roleService.assignRoleToUser(assignRoleDto);
  }

  /**
   * حذف دور
   */
  @Delete(':id')
  @Permissions('roles.delete')
  @HttpCode(HttpStatus.OK)
  remove(@Param('id') id: string) {
    return this.roleService.remove(id);
  }
}
