"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CachePermanent = exports.CacheLong = exports.CacheMedium = exports.CacheShort = exports.InvalidateCache = exports.Cache = exports.CACHE_KEY = void 0;
const common_1 = require("@nestjs/common");
exports.CACHE_KEY = 'cache';
const Cache = (options = {}) => (0, common_1.SetMetadata)(exports.CACHE_KEY, options);
exports.Cache = Cache;
const InvalidateCache = (...patterns) => (0, common_1.SetMetadata)('invalidate_cache', patterns);
exports.InvalidateCache = InvalidateCache;
const CacheShort = () => (0, exports.Cache)({ ttl: 300 });
exports.CacheShort = CacheShort;
const CacheMedium = () => (0, exports.Cache)({ ttl: 1800 });
exports.CacheMedium = CacheMedium;
const CacheLong = () => (0, exports.Cache)({ ttl: 7200 });
exports.CacheLong = CacheLong;
const CachePermanent = () => (0, exports.Cache)({ ttl: 86400 });
exports.CachePermanent = CachePermanent;
//# sourceMappingURL=cache.decorator.js.map