import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  Timestamp,
} from 'typeorm'

@Entity('mutes')
export class DBMute extends BaseEntity {
  @PrimaryGeneratedColumn('increment', {
    type: 'int',
    comment: 'ミュート独自ID',
  })
  rowId!: number

  @Column({
    type: 'varchar',
    comment: 'ミュートテキスト',
  })
  text!: string

  @CreateDateColumn({
    type: 'timestamp',
    comment: '行挿入日時',
  })
  createdAt!: Timestamp
}
