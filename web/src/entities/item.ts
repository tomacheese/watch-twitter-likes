import {
  BaseEntity,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  Timestamp,
} from 'typeorm'
import { DBImage } from './images'
import { DBTarget } from './targets'
import { DBTweet } from './tweets'

@Entity('items')
export class DBItem extends BaseEntity {
  @PrimaryGeneratedColumn('increment', {
    type: 'int',
    comment: 'アイテムID',
  })
  rowId!: number

  @ManyToOne(() => DBTweet, (tweet) => tweet.items)
  @JoinColumn({
    name: 'tweet_id',
    referencedColumnName: 'tweetId',
  })
  tweet!: DBTweet

  @OneToMany(() => DBImage, (image) => image.items)
  images!: DBImage[]

  @ManyToOne(() => DBTarget, (target) => target.items)
  @JoinColumn({
    name: 'user_id',
    referencedColumnName: 'userId',
  })
  target!: DBTarget

  @CreateDateColumn({
    type: 'timestamp',
    comment: '行挿入日時',
  })
  createdAt!: Timestamp
}
