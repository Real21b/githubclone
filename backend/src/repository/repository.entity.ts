import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { ObjectType, Field, ID } from '@nestjs/graphql';
import { User } from '../user/user.entity';

@Entity('repositories')
@ObjectType()
export class Repository {
  @PrimaryGeneratedColumn('uuid')
  @Field(() => ID)
  id: string;

  @Column()
  @Field()
  name: string;

  @Column({ nullable: true })
  @Field({ nullable: true })
  description?: string;

  @Column({ default: false })
  @Field()
  isPrivate: boolean;

  @Column({ default: 0 })
  @Field()
  starsCount: number;

  @Column({ default: 0 })
  @Field()
  forksCount: number;

  @Column({ default: 0 })
  @Field()
  watchersCount: number;

  @Column({ nullable: true })
  @Field({ nullable: true })
  language?: string;

  @Column({ default: 'main' })
  @Field()
  defaultBranch: string;

  @ManyToOne(() => User, user => user.repositories)
  @JoinColumn({ name: 'ownerId' })
  @Field(() => User)
  owner: User;

  @Column()
  ownerId: string;

  @CreateDateColumn()
  @Field()
  createdAt: Date;

  @UpdateDateColumn()
  @Field()
  updatedAt: Date;
}
