import { InputType, Field } from 'type-graphql';

@InputType()
export class UpdateRepositoryInput {
  @Field({ nullable: true })
  name?: string;

  @Field({ nullable: true })
  description?: string;

  @Field({ nullable: true })
  isPrivate?: boolean;

  @Field({ nullable: true })
  language?: string;

  @Field({ nullable: true })
  defaultBranch?: string;
}
