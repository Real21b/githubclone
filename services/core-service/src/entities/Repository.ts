import { ObjectType, Field, ID } from 'type-graphql';
import { User } from './User';

@ObjectType()
export class Repository {
  @Field(() => ID)
  id: string;

  @Field()
  name: string;

  @Field({ nullable: true })
  description?: string;

  @Field()
  isPrivate: boolean;

  @Field()
  starsCount: number;

  @Field()
  forksCount: number;

  @Field()
  watchersCount: number;

  @Field({ nullable: true })
  language?: string;

  @Field()
  defaultBranch: string;

  @Field(() => User)
  owner: User;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}
