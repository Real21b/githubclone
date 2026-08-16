import { Field, InputType, PartialType } from '@nestjs/graphql';
import { CreateRepositoryInput } from './create-repository.input';

@InputType()
export class UpdateRepositoryInput extends PartialType(CreateRepositoryInput) {
  @Field({ nullable: true })
  description?: string;

  @Field({ nullable: true })
  isPrivate?: boolean;

  @Field({ nullable: true })
  language?: string;
}
