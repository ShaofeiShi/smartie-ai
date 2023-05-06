import { BaseEntity, Column, Entity, PrimaryGeneratedColumn } from 'typeorm'

@Entity()
export class User extends BaseEntity {
  @PrimaryGeneratedColumn()
    id: number

  @Column({ unique: true, length: 100 })
    email: string

  @Column({ length: 100 })
    password: string

  @Column({ unique: true, length: 100 })
    nickname: string
}
