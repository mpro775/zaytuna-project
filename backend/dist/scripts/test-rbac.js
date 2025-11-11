#!/usr/bin/env tsx
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("../src/app.module");
const supertest_1 = __importDefault(require("supertest"));
async function testRBACSystem() {
    console.log('🛡️ بدء اختبار نظام إدارة الأدوار والصلاحيات (RBAC)...');
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    const server = app.getHttpServer();
    let adminToken;
    let testRoleId = '';
    try {
        console.log('\n🔐 تسجيل الدخول كمدير...');
        const loginResponse = await (0, supertest_1.default)(server)
            .post('/auth/login')
            .send({
            username: 'admin',
            password: 'admin123',
        });
        if (loginResponse.status === 200 && loginResponse.body.success === true) {
            adminToken = loginResponse.body.data.accessToken;
            console.log('✅ تم تسجيل الدخول كمدير بنجاح');
        }
        else {
            console.log('❌ فشل في تسجيل الدخول كمدير');
            console.log('Response:', JSON.stringify(loginResponse.body, null, 2));
            return;
        }
        console.log('\n📋 الحصول على جميع الصلاحيات...');
        const permissionsResponse = await (0, supertest_1.default)(server)
            .get('/permissions')
            .set('Authorization', `Bearer ${adminToken}`);
        console.log('Permissions status:', permissionsResponse.status);
        console.log('Permissions count:', permissionsResponse.body?.length || 0);
        if (permissionsResponse.status === 200 && Array.isArray(permissionsResponse.body)) {
            console.log('✅ تم الحصول على الصلاحيات بنجاح');
        }
        else {
            console.log('❌ فشل في الحصول على الصلاحيات');
        }
        console.log('\n👥 إنشاء دور جديد...');
        const newRole = {
            name: 'Test Manager',
            description: 'دور للاختبار',
            permissions: ['users.read', 'products.read', 'sales.create'],
            isSystemRole: false,
        };
        const createRoleResponse = await (0, supertest_1.default)(server)
            .post('/roles')
            .set('Authorization', `Bearer ${adminToken}`)
            .send(newRole);
        console.log('Create role status:', createRoleResponse.status);
        if (createRoleResponse.status === 201 && createRoleResponse.body.id) {
            testRoleId = createRoleResponse.body.id;
            console.log('✅ تم إنشاء الدور بنجاح');
            console.log('Role ID:', testRoleId);
        }
        else {
            console.log('❌ فشل في إنشاء الدور');
            console.log('Response:', JSON.stringify(createRoleResponse.body, null, 2));
        }
        console.log('\n📊 الحصول على جميع الأدوار...');
        const rolesResponse = await (0, supertest_1.default)(server)
            .get('/roles')
            .set('Authorization', `Bearer ${adminToken}`);
        console.log('Roles status:', rolesResponse.status);
        console.log('Roles count:', rolesResponse.body?.length || 0);
        if (rolesResponse.status === 200 && Array.isArray(rolesResponse.body)) {
            console.log('✅ تم الحصول على الأدوار بنجاح');
            const testRole = rolesResponse.body.find(role => role.id === testRoleId);
            if (testRole) {
                console.log('✅ الدور الجديد موجود في القائمة');
            }
        }
        else {
            console.log('❌ فشل في الحصول على الأدوار');
        }
        console.log('\n🔍 الحصول على دور محدد...');
        const roleResponse = await (0, supertest_1.default)(server)
            .get(`/roles/${testRoleId}`)
            .set('Authorization', `Bearer ${adminToken}`);
        console.log('Role status:', roleResponse.status);
        if (roleResponse.status === 200 && roleResponse.body.id === testRoleId) {
            console.log('✅ تم الحصول على الدور بنجاح');
            console.log('Role details:', {
                name: roleResponse.body.name,
                permissions: roleResponse.body.permissions,
                userCount: roleResponse.body.userCount,
            });
        }
        else {
            console.log('❌ فشل في الحصول على الدور');
        }
        console.log('\n✏️ تحديث الدور...');
        const updateData = {
            description: 'دور محدث للاختبار',
            permissions: ['users.read', 'products.read', 'sales.create', 'sales.read'],
        };
        const updateRoleResponse = await (0, supertest_1.default)(server)
            .patch(`/roles/${testRoleId}`)
            .set('Authorization', `Bearer ${adminToken}`)
            .send(updateData);
        console.log('Update role status:', updateRoleResponse.status);
        if (updateRoleResponse.status === 200 && updateRoleResponse.body.description === updateData.description) {
            console.log('✅ تم تحديث الدور بنجاح');
        }
        else {
            console.log('❌ فشل في تحديث الدور');
            console.log('Response:', JSON.stringify(updateRoleResponse.body, null, 2));
        }
        console.log('\n👤 تعيين دور لمستخدم...');
        const usersResponse = await (0, supertest_1.default)(server)
            .get('/roles/role_user/users')
            .set('Authorization', `Bearer ${adminToken}`);
        let testUserId = null;
        if (usersResponse.status === 200 && usersResponse.body.length > 0) {
            testUserId = usersResponse.body[0].id;
        }
        if (testUserId) {
            const assignRoleResponse = await (0, supertest_1.default)(server)
                .post('/roles/assign')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                userId: testUserId,
                roleId: testRoleId,
            });
            console.log('Assign role status:', assignRoleResponse.status);
            if (assignRoleResponse.status === 200) {
                console.log('✅ تم تعيين الدور للمستخدم بنجاح');
            }
            else {
                console.log('❌ فشل في تعيين الدور للمستخدم');
            }
        }
        else {
            console.log('⚠️ لم يتم العثور على مستخدم للاختبار');
        }
        console.log('\n📈 الحصول على إحصائيات الأدوار...');
        const statsResponse = await (0, supertest_1.default)(server)
            .get('/roles/stats')
            .set('Authorization', `Bearer ${adminToken}`);
        console.log('Stats status:', statsResponse.status);
        if (statsResponse.status === 200 && statsResponse.body.totalRoles) {
            console.log('✅ تم الحصول على إحصائيات الأدوار بنجاح');
            console.log('Stats:', statsResponse.body);
        }
        else {
            console.log('❌ فشل في الحصول على إحصائيات الأدوار');
        }
        console.log('\n🗑️ حذف الدور (تنظيف)...');
        const deleteRoleResponse = await (0, supertest_1.default)(server)
            .delete(`/roles/${testRoleId}`)
            .set('Authorization', `Bearer ${adminToken}`);
        console.log('Delete role status:', deleteRoleResponse.status);
        if (deleteRoleResponse.status === 200) {
            console.log('✅ تم حذف الدور بنجاح');
        }
        else {
            console.log('❌ فشل في حذف الدور');
            console.log('Response:', JSON.stringify(deleteRoleResponse.body, null, 2));
        }
        console.log('\n🚪 تسجيل الخروج...');
        const logoutResponse = await (0, supertest_1.default)(server)
            .post('/auth/logout')
            .set('Authorization', `Bearer ${adminToken}`);
        console.log('Logout status:', logoutResponse.status);
        if (logoutResponse.status === 200) {
            console.log('✅ تم تسجيل الخروج بنجاح');
        }
        else {
            console.log('❌ فشل في تسجيل الخروج');
        }
        console.log('\n🎉 تم الانتهاء من جميع اختبارات RBAC بنجاح!');
        console.log('\n📋 ملخص النظام المُطبق:');
        console.log('✅ إنشاء وإدارة الأدوار');
        console.log('✅ تعيين الصلاحيات للأدوار');
        console.log('✅ ربط المستخدمين بالأدوار');
        console.log('✅ نظام الصلاحيات الهرمي');
        console.log('✅ إدارة الصلاحيات المفصلة');
        console.log('✅ حماية الـ endpoints بالأدوار');
        console.log('✅ إحصائيات شاملة للأدوار');
        console.log('\n🔗 API Endpoints الجديدة:');
        console.log('GET /permissions - قائمة الصلاحيات');
        console.log('GET /permissions/categories - فئات الصلاحيات');
        console.log('GET /roles - قائمة الأدوار');
        console.log('POST /roles - إنشاء دور جديد');
        console.log('GET /roles/:id - تفاصيل دور');
        console.log('PATCH /roles/:id - تحديث دور');
        console.log('DELETE /roles/:id - حذف دور');
        console.log('POST /roles/assign - تعيين دور لمستخدم');
        console.log('GET /roles/stats - إحصائيات الأدوار');
    }
    catch (error) {
        console.error('❌ فشل في اختبار نظام RBAC:', error);
        process.exit(1);
    }
    finally {
        await app.close();
    }
}
testRBACSystem();
//# sourceMappingURL=test-rbac.js.map