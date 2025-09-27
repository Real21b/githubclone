import { Resolver, Query } from '@nestjs/graphql';
import { HealthService } from './health.service';
import { Health } from './health.entity';

@Resolver(() => Health)
export class HealthResolver {
  constructor(private readonly healthService: HealthService) {}

  @Query(() => Health, { name: 'getHealth' })
  getHealth(): Health {
    return this.healthService.getHealth();
  }
}
