import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  Timestamp,
} from 'typeorm'
import { DBTweet } from './entities/tweets'

@Entity('users')
export class DBUser extends BaseEntity {
  @Column({
    type: 'bigint',
    unsigned: true,
    comment: 'ユーザID',
    primary: true,
    unique: true,
  })
  userId!: string

  @Column({
    type: 'varchar',
    comment: 'ユーザ名',
  })
  screenName!: string

  @CreateDateColumn({
    type: 'timestamp',
    comment: '行挿入日時',
  })
  createdAt!: Timestamp

  @OneToMany(() => DBTweet, (tweet) => tweet.user)
  tweets!: DBTweet[]
}
