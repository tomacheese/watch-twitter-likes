import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  Timestamp,
} from 'typeorm'
import { DBImage } from './images'
import { DBItem } from './item'
import { DBUser } from './users'

@Entity('tweets')
export class DBTweet extends BaseEntity {
  @Column({
    type: 'bigint',
    unsigned: true,
    comment: 'ツイートID',
    primary: true,
    unique: true,
  })
  tweetId!: string

  @CreateDateColumn({
    type: 'timestamp',
    comment: '行挿入日時',
  })
  createdAt!: Timestamp

  @ManyToOne(() => DBUser, (user) => user.tweets)
  user!: DBUser

  @OneToMany(() => DBItem, (item) => item.tweet)
  items!: DBItem[]

  @OneToMany(() => DBImage, (image) => image.tweet)
  images!: DBImage[]
}
