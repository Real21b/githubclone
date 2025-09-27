import { InputType, Field, ID } from 'type-graphql';

@InputType()
export class CreateRepositoryInput {
  @Field()
  name: string;

  @Field({ nullable: true })
  description?: string;

  @Field()
  isPrivate: boolean;

  @Field({ nullable: true })
  language?: string;

  @Field()
  defaultBranch: string;

  @Field(() => ID)
  ownerId: string;
}
