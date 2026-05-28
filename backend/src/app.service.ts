import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): { message: string } {
    return {
      message: 'مرحباً بك في نظام الزيتون سوفت API! 🚀',
    };
  }
}
