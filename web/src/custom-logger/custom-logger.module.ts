import { Module } from '@nestjs/common'
import { AccessLoggerService } from './access-logger.service'
import { ErrorLoggerService } from './error-logger.service'

/**
 * Custom logger module
 */
@Module({
  providers: [AccessLoggerService, ErrorLoggerService],
  exports: [AccessLoggerService, ErrorLoggerService],
})
export class CustomLoggerModule {}
