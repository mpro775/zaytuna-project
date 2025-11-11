"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateGLAccountDto = void 0;
const mapped_types_1 = require("@nestjs/mapped-types");
const create_gl_account_dto_1 = require("./create-gl-account.dto");
class UpdateGLAccountDto extends (0, mapped_types_1.PartialType)(create_gl_account_dto_1.CreateGLAccountDto) {
}
exports.UpdateGLAccountDto = UpdateGLAccountDto;
//# sourceMappingURL=update-gl-account.dto.js.map