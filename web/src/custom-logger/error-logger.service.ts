import { Injectable, LoggerService } from '@nestjs/common'
import { createLogger, format, Logger } from 'winston'
import DailyRotateFile from 'winston-daily-rotate-file'
import * as Transport from 'winston-transport'

/**
 * Custom error logger service
 */
@Injectable()
export class ErrorLoggerService implements LoggerService {
  logger: Logger

  constructor() {
    const logTransFormStream = new DailyRotateFile({
      level: 'error',
      dirname: `logs/error/`,
      filename: `log_%DATE%.log`,
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxFiles: '30d',
    })

    logTransFormStream.on('rotate', () => this.logger.info('Rotated log file'))

    const t: Transport[] = [logTransFormStream]

    this.logger = createLogger({
      format: format.combine(format.timestamp(), format.json()),
      transports: t,
    })
  }

  /**
   * 通常ログ
   *
   * @param message ログメッセージ
   */
  log(message: string) {
    this.logger.info(message)
  }

  /**
   * エラーログ
   *
   * @param message ログメッセージ
   */
  error(message: string) {
    this.logger.error(message)
  }

  /**
   * 警告ログ
   *
   * @param message ログメッセージ
   */
  warn(message: string) {
    this.logger.warn(message)
  }

  /**
   * デバッグログ
   *
   * @param message ログメッセージ
   */
  debug(message: string) {
    this.logger.debug(message)
  }
}
