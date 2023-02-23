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

@Entity('images')
export class DBImage extends BaseEntity {
  @PrimaryGeneratedColumn('increment', {
    type: 'int',
    comment: '画像独自ID',
  })
  rowId!: number

  @Column({
    type: 'varchar',
    comment: '画像ID',
  })
  imageId!: string

  @ManyToOne(() => DBTweet, (tweet) => tweet.images)
  @JoinColumn({
    name: 'tweet_id',
    referencedColumnName: 'tweetId',
  })
  tweet!: DBTweet

  @Column({
    type: 'enum',
    enum: ['thumb', 'large', 'medium', 'small'],
    comment: '画像サイズ',
  })
  size!: 'thumb' | 'large' | 'medium' | 'small'

  @ManyToOne(() => DBItem, (item) => item.images)
  items!: DBItem

  @Column({
    type: 'int',
    comment: '画像の幅',
  })
  width!: number

  @Column({
    type: 'int',
    comment: '画像の高さ',
  })
  height!: number

  @CreateDateColumn({
    type: 'timestamp',
    comment: '行挿入日時',
  })
  createdAt!: Timestamp
}
