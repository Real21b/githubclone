import { ObjectType, Field } from 'type-graphql';

@ObjectType()
export class Health {
  @Field()
  status: string;

  @Field()
  timestamp: string;

  @Field()
  uptime: number;

  @Field()
  environment: string;

  @Field()
  service: string;

  @Field()
  memory: string;

  @Field()
  version: string;
}
