import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  Timestamp,
} from 'typeorm'
import { DBItem } from './item'

@Entity('targets')
export class DBTarget extends BaseEntity {
  @Column({
    type: 'bigint',
    unsigned: true,
    comment: 'ユーザーID',
    primary: true,
    unique: true,
  })
  userId!: string

  @Column({
    type: 'varchar',
    comment: 'ユーザー名',
  })
  name!: string

  @Column({
    type: 'bigint',
    unsigned: true,
    comment: 'スレッドID',
  })
  threadId!: string

  @CreateDateColumn({
    type: 'timestamp',
    comment: '行挿入日時',
  })
  createdAt!: Timestamp

  @OneToMany(() => DBItem, (item) => item.target)
  items!: DBItem[]
}
