import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Timestamp,
} from 'typeorm'
import { DBItem } from './item'
import { DBTweet } from './tweets'

@Entity('media')
export class DBMedia extends BaseEntity {
  @PrimaryGeneratedColumn('increment', {
    type: 'int',
    comment: 'メディア独自ID',
  })
  rowId!: number

  @Column({
    type: 'enum',
    enum: ['photo', 'video', 'animated_gif'],
    comment: 'メディアの種類',
  })
  type!: string

  @Column({
    type: 'varchar',
    comment: 'メディアのURLタイプ',
  })
  urlType!: string

  @Column({
    type: 'varchar',
    comment: 'メディアID',
  })
  mediaId!: string

  @Column({
    type: 'varchar',
    comment: 'メディアの拡張子',
  })
  extension!: string

  @ManyToOne(() => DBTweet, (tweet) => tweet.media)
  @JoinColumn({
    name: 'tweet_id',
    referencedColumnName: 'tweetId',
  })
  tweet!: DBTweet

  @Column({
    type: 'enum',
    enum: ['thumb', 'large', 'medium', 'small'],
    comment: 'メディアサイズ',
  })
  size!: 'thumb' | 'large' | 'medium' | 'small'

  @ManyToOne(() => DBItem, (item) => item.media)
  items!: DBItem

  @Column({
    type: 'int',
    comment: 'メディアの幅',
  })
  width!: number

  @Column({
    type: 'int',
    comment: 'メディアの高さ',
  })
  height!: number

  @CreateDateColumn({
    type: 'timestamp',
    comment: '行挿入日時',
  })
  createdAt!: Timestamp
}
