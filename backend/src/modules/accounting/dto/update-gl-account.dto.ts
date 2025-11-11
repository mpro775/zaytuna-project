import { PartialType } from '@nestjs/mapped-types';
import { CreateGLAccountDto } from './create-gl-account.dto';

export class UpdateGLAccountDto extends PartialType(CreateGLAccountDto) {}
