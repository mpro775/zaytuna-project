/**
 * Mock Auth Service
 * Handles authentication-related mock API calls
 */

import authData from '../data/auth.json';
import usersData from '../data/users.json';
import { mockApi } from './mock-api';
import { generateId, simulateDelay } from './mock-utils';
import type { MockRequest, MockResponse } from '../types';

// Load data
let authUsers = [...authData.users];
let users = [...usersData];

// Register handlers
mockApi.registerHandler('POST:/auth/login', async (request: MockRequest): Promise<MockResponse> => {
  await simulateDelay(200, 400);
  
  const { username, password } = request.data || {};
  
  const user = authUsers.find(
    (u) => u.username === username && u.password === password
  );
  
  if (!user) {
    throw {
      response: {
        status: 401,
        data: {
          message: 'اسم المستخدم أو كلمة المرور غير صحيحة',
          statusCode: 401,
        },
      },
    };
  }
  
  const userDetails = users.find((u) => u.id === user.id);
  
  return {
    data: {
      accessToken: `mock-token-${generateId()}`,
      refreshToken: `mock-refresh-${generateId()}`,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        branch: userDetails?.branch?.name,
      },
      expiresIn: 3600,
    },
    statusCode: 200,
  };
});

mockApi.registerHandler('POST:/auth/logout', async (request: MockRequest): Promise<MockResponse> => {
  await simulateDelay(100, 200);
  
  return {
    data: {
      message: 'تم تسجيل الخروج بنجاح',
    },
    statusCode: 200,
  };
});

mockApi.registerHandler('POST:/auth/refresh', async (request: MockRequest): Promise<MockResponse> => {
  await simulateDelay(150, 300);
  
  const { refreshToken } = request.data || {};
  
  if (!refreshToken || !refreshToken.startsWith('mock-refresh-')) {
    throw {
      response: {
        status: 401,
        data: {
          message: 'رمز التحديث غير صالح',
          statusCode: 401,
        },
      },
    };
  }
  
  return {
    data: {
      accessToken: `mock-token-${generateId()}`,
      refreshToken: `mock-refresh-${generateId()}`,
      expiresIn: 3600,
    },
    statusCode: 200,
  };
});

mockApi.registerHandler('GET:/auth/me', async (request: MockRequest): Promise<MockResponse> => {
  await simulateDelay(100, 200);
  
  // Get user from token (simplified - in real app, decode token)
  const token = request.headers?.['Authorization']?.replace('Bearer ', '');
  
  if (!token) {
    throw {
      response: {
        status: 401,
        data: {
          message: 'غير مصرح',
          statusCode: 401,
        },
      },
    };
  }
  
  // Return first user as mock
  const user = users[0];
  
  return {
    data: {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      branch: user.branch?.name,
    },
    statusCode: 200,
  };
});

mockApi.registerHandler('GET:/auth/verify', async (request: MockRequest): Promise<MockResponse> => {
  await simulateDelay(100, 200);
  
  const token = request.headers?.['Authorization']?.replace('Bearer ', '');
  
  if (!token || !token.startsWith('mock-token-')) {
    return {
      data: {
        valid: false,
        user: null,
      },
      statusCode: 200,
    };
  }
  
  const user = users[0];
  
  return {
    data: {
      valid: true,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        branch: user.branch?.name,
      },
    },
    statusCode: 200,
  };
});

mockApi.registerHandler('POST:/auth/2fa/send', async (request: MockRequest): Promise<MockResponse> => {
  await simulateDelay(200, 400);
  
  return {
    data: {
      message: 'تم إرسال رمز التحقق بنجاح',
    },
    statusCode: 200,
  };
});

mockApi.registerHandler('POST:/auth/2fa/verify', async (request: MockRequest): Promise<MockResponse> => {
  await simulateDelay(200, 400);
  
  const { code } = request.data || {};
  
  if (code !== '123456') {
    throw {
      response: {
        status: 400,
        data: {
          message: 'رمز التحقق غير صحيح',
          statusCode: 400,
        },
      },
    };
  }
  
  const user = users[0];
  
  return {
    data: {
      accessToken: `mock-token-${generateId()}`,
      refreshToken: `mock-refresh-${generateId()}`,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        branch: user.branch?.name,
      },
      expiresIn: 3600,
    },
    statusCode: 200,
  };
});

mockApi.registerHandler('POST:/auth/2fa/toggle', async (request: MockRequest): Promise<MockResponse> => {
  await simulateDelay(150, 300);
  
  return {
    data: {
      message: 'تم تحديث إعدادات التحقق بخطوتين',
    },
    statusCode: 200,
  };
});

mockApi.registerHandler('POST:/auth/2fa/setup/app', async (request: MockRequest): Promise<MockResponse> => {
  await simulateDelay(200, 400);
  
  return {
    data: {
      secret: 'MOCK_SECRET_KEY_123456',
      qrCodeUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
    },
    statusCode: 200,
  };
});

mockApi.registerHandler('PATCH:/auth/password', async (request: MockRequest): Promise<MockResponse> => {
  await simulateDelay(200, 400);
  
  const { currentPassword, newPassword } = request.data || {};
  
  if (!currentPassword || !newPassword) {
    throw {
      response: {
        status: 400,
        data: {
          message: 'كلمة المرور الحالية وكلمة المرور الجديدة مطلوبة',
          statusCode: 400,
        },
      },
    };
  }
  
  return {
    data: {
      message: 'تم تغيير كلمة المرور بنجاح',
    },
    statusCode: 200,
  };
});

