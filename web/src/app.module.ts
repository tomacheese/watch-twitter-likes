import { Module } from '@nestjs/common'
import { AppController } from './app.controller'
import { AppService } from './app.service'
import { TypeOrmModule } from '@nestjs/typeorm'
import { getConfig } from './config'
import { DBImage } from './entities/images'
import { DBItem } from './entities/item'
import { DBTarget } from './entities/targets'
import { DBTweet } from './entities/tweets'
import { DBUser } from './entities/users'
import { SnakeNamingStrategy } from 'typeorm-naming-strategies'

const config = getConfig()

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: config.db.type,
      host: config.db.host,
      port: config.db.port,
      username: config.db.username,
      password: config.db.password,
      database: config.db.database,
      synchronize: false, // Crawlerに任せる
      logging: process.env.NODE_ENV === 'development',
      namingStrategy: new SnakeNamingStrategy(),
      entities: [DBImage, DBItem, DBTarget, DBTweet, DBUser],
      subscribers: [],
      migrations: [],
      timezone: '+09:00',
      supportBigNumbers: true,
      bigNumberStrings: true,
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
