import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  Timestamp,
} from 'typeorm'
import { DBMedia } from './media'
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

  @Column({
    type: 'varchar',
    length: 2000,
    comment: 'ツイート本文',
    nullable: true,
  })
  text!: string | null

  @Column({
    type: 'simple-array',
    comment: 'タグ',
    nullable: true,
  })
  tags!: string[] | null

  @CreateDateColumn({
    type: 'timestamp',
    comment: '行挿入日時',
  })
  createdAt!: Timestamp

  @ManyToOne(() => DBUser, (user) => user.tweets)
  user!: DBUser

  @OneToMany(() => DBItem, (item) => item.tweet)
  items!: DBItem[]

  @OneToMany(() => DBMedia, (image) => image.tweet)
  media!: DBMedia[]
}
