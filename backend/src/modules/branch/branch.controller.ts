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
import { BranchService } from './branch.service';
import { CreateBranchDto } from './dto/create-branch.dto';
import { UpdateBranchDto } from './dto/update-branch.dto';
import { Permissions } from '../../common/decorators/permissions.decorator';

@Controller('branches')
export class BranchController {
  constructor(private readonly branchService: BranchService) {}

  /**
   * إنشاء فرع جديد
   */
  @Post()
  @Permissions('branches.manage')
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createBranchDto: CreateBranchDto) {
    return this.branchService.create(createBranchDto);
  }

  /**
   * الحصول على جميع الفروع
   */
  @Get()
  @Permissions('branches.read')
  findAll(@Query('companyId') companyId?: string) {
    return this.branchService.findAll(companyId);
  }

  /**
   * الحصول على إحصائيات الفروع
   */
  @Get('stats')
  @Permissions('branches.read')
  getBranchStats() {
    return this.branchService.getBranchStats();
  }

  /**
   * الحصول على فرع بالمعرف
   */
  @Get(':id')
  @Permissions('branches.read')
  findOne(@Param('id') id: string) {
    return this.branchService.findOne(id);
  }

  /**
   * الحصول على المستخدمين بالفرع
   */
  @Get(':id/users')
  @Permissions('users.read')
  getUsersByBranch(@Param('id') id: string) {
    return this.branchService.getUsersByBranch(id);
  }

  /**
   * تحديث فرع
   */
  @Patch(':id')
  @Permissions('branches.manage')
  @HttpCode(HttpStatus.OK)
  update(@Param('id') id: string, @Body() updateBranchDto: UpdateBranchDto) {
    return this.branchService.update(id, updateBranchDto);
  }

  /**
   * حذف فرع
   */
  @Delete(':id')
  @Permissions('branches.manage')
  @HttpCode(HttpStatus.OK)
  remove(@Param('id') id: string) {
    return this.branchService.remove(id);
  }
}
