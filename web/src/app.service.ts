import { Injectable } from '@nestjs/common'
import { DBItem } from './entities/item'
import { DBTarget } from './entities/targets'

@Injectable()
export class AppService {
  async getImages() {
    return await DBItem.find({
      relations: ['tweet', 'tweet.user', 'images', 'target'],
    })
  }

  async addTarget(name: string, userId: string, threadId: string) {
    const target = new DBTarget()
    target.name = name
    target.userId = userId
    target.threadId = threadId
    return await target.save()
  }
}
