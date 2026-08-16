import { Query, Resolver } from '@nestjs/graphql';
import { Health } from './health.entity';
import { HealthService } from './health.service';

@Resolver(() => Health)
export class HealthResolver {
  constructor(private readonly healthService: HealthService) {}

  @Query(() => Health, { name: 'getHealth' })
  getHealth(): Health {
    return this.healthService.getHealth();
  }
}
