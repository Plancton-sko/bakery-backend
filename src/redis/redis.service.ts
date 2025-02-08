// src/redis/redis.service.ts
import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { createClient } from 'redis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  public client = createClient({
    url: process.env.REDIS_URL,
    legacyMode: true
  });

  async onModuleInit() {
    await this.client.connect();
  }

  async onModuleDestroy() {
    await this.client.disconnect();
  }
}