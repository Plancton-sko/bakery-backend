import { Module } from "@nestjs/common";
import { LogsService } from "./logs.service";
import { EnhancedNativeLogger } from "./nest-logger.service";

@Module({
    providers: [LogsService, EnhancedNativeLogger],
    exports: [EnhancedNativeLogger],
  })
  export class LoggerModule {}
  