// src/app.controller.ts
import { Controller, Get } from '@nestjs/common';
import { RedisService } from './redis/redis.service';


@Controller()
export class AppController {
  constructor(private readonly redisService: RedisService) {}

  @Get('health/redis')
  async checkRedis() {
    const ping = await this.redisService.client.ping();
    return {
      status: ping === 'PONG' ? 'OK' : 'ERROR',
      redisVersion: await this.redisService.client.info('server')
    };
  }
}
