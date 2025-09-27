import { ObjectType, Field, ID } from 'type-graphql';
import { Repository } from './Repository';

@ObjectType()
export class User {
  @Field(() => ID)
  id: string;

  @Field()
  username: string;

  @Field()
  email: string;

  @Field({ nullable: true })
  bio?: string;

  @Field({ nullable: true })
  avatar?: string;

  @Field()
  followersCount: number;

  @Field()
  followingCount: number;

  @Field(() => [Repository], { nullable: true })
  repositories?: Repository[];

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}
