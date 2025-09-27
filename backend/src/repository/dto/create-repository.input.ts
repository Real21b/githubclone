import { InputType, Field } from '@nestjs/graphql';
import { IsNotEmpty, IsString, IsBoolean, IsOptional, IsUUID } from 'class-validator';

@InputType()
export class CreateRepositoryInput {
  @Field()
  @IsNotEmpty()
  @IsString()
  name: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  description?: string;

  @Field({ defaultValue: false })
  @IsBoolean()
  isPrivate: boolean;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  language?: string;

  @Field({ defaultValue: 'main' })
  @IsString()
  defaultBranch: string;

  @Field()
  @IsUUID()
  ownerId: string;
}
