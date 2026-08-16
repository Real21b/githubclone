import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Repository } from './repository.entity';
import { RepositoryResolver } from './repository.resolver';
import { RepositoryService } from './repository.service';

@Module({
  imports: [TypeOrmModule.forFeature([Repository])],
  providers: [RepositoryService, RepositoryResolver],
  exports: [RepositoryService],
})
export class RepositoryModule {}
