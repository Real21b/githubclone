import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RepositoryService } from './repository.service';
import { RepositoryResolver } from './repository.resolver';
import { Repository } from './repository.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Repository])],
  providers: [RepositoryService, RepositoryResolver],
  exports: [RepositoryService],
})
export class RepositoryModule {}
