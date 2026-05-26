import { applyDecorators } from '@nestjs/common';
import { IsString, MaxLength, Matches } from 'class-validator';

export function IsEntityId() {
  return applyDecorators(
    IsString(),
    MaxLength(64),
    Matches(/^[A-Za-z0-9_:-]+$/, {
      message: 'Entity id must be a string id such as a cuid or stable seed id',
    }),
  );
}
