import { Resolver, Query, Mutation, Args, ID } from '@nestjs/graphql';
import { RepositoryService } from './repository.service';
import { Repository } from './repository.entity';
import { CreateRepositoryInput } from './dto/create-repository.input';
import { UpdateRepositoryInput } from './dto/update-repository.input';

@Resolver(() => Repository)
export class RepositoryResolver {
  constructor(private readonly repositoryService: RepositoryService) {}

  @Query(() => [Repository], { name: 'repositories' })
  findAll(): Promise<Repository[]> {
    return this.repositoryService.findAll();
  }

  @Query(() => Repository, { name: 'repository' })
  findOne(@Args('id', { type: () => ID }) id: string): Promise<Repository> {
    return this.repositoryService.findById(id);
  }

  @Query(() => [Repository], { name: 'repositoriesByOwner' })
  findByOwner(@Args('ownerId', { type: () => ID }) ownerId: string): Promise<Repository[]> {
    return this.repositoryService.findByOwner(ownerId);
  }

  @Mutation(() => Repository)
  createRepository(@Args('createRepositoryInput') createRepositoryInput: CreateRepositoryInput): Promise<Repository> {
    return this.repositoryService.create(createRepositoryInput);
  }

  @Mutation(() => Repository)
  updateRepository(
    @Args('id', { type: () => ID }) id: string,
    @Args('updateRepositoryInput') updateRepositoryInput: UpdateRepositoryInput,
  ): Promise<Repository> {
    return this.repositoryService.update(id, updateRepositoryInput);
  }

  @Mutation(() => Boolean)
  deleteRepository(@Args('id', { type: () => ID }) id: string): Promise<boolean> {
    return this.repositoryService.delete(id);
  }

  @Mutation(() => Repository)
  starRepository(@Args('id', { type: () => ID }) id: string): Promise<Repository> {
    return this.repositoryService.star(id);
  }

  @Mutation(() => Repository)
  forkRepository(
    @Args('id', { type: () => ID }) id: string,
    @Args('newOwnerId', { type: () => ID }) newOwnerId: string,
  ): Promise<Repository> {
    return this.repositoryService.fork(id, newOwnerId);
  }
}
