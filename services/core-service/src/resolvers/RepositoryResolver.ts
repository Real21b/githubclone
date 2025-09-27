import { Resolver, Query, Mutation, Arg, ID, Ctx } from 'type-graphql';
import { Repository } from '../entities/Repository';
import { CreateRepositoryInput } from '../inputs/CreateRepositoryInput';
import { UpdateRepositoryInput } from '../inputs/UpdateRepositoryInput';
import { Context } from '../types/Context';
import { RepositoryService } from '../services/RepositoryService';

@Resolver(() => Repository)
export class RepositoryResolver {
  private repositoryService: RepositoryService;

  constructor() {
    this.repositoryService = new RepositoryService();
  }

  @Query(() => [Repository], { name: 'repositories' })
  async getRepositories(@Ctx() ctx: Context): Promise<Repository[]> {
    return this.repositoryService.findAll(ctx);
  }

  @Query(() => Repository, { name: 'repository' })
  async getRepository(
    @Arg('id', () => ID) id: string,
    @Ctx() ctx: Context
  ): Promise<Repository> {
    return this.repositoryService.findById(id, ctx);
  }

  @Query(() => [Repository], { name: 'repositoriesByOwner' })
  async getRepositoriesByOwner(
    @Arg('ownerId', () => ID) ownerId: string,
    @Ctx() ctx: Context
  ): Promise<Repository[]> {
    return this.repositoryService.findByOwner(ownerId, ctx);
  }

  @Mutation(() => Repository)
  async createRepository(
    @Arg('input') input: CreateRepositoryInput,
    @Ctx() ctx: Context
  ): Promise<Repository> {
    return this.repositoryService.create(input, ctx);
  }

  @Mutation(() => Repository)
  async updateRepository(
    @Arg('id', () => ID) id: string,
    @Arg('input') input: UpdateRepositoryInput,
    @Ctx() ctx: Context
  ): Promise<Repository> {
    return this.repositoryService.update(id, input, ctx);
  }

  @Mutation(() => Boolean)
  async deleteRepository(
    @Arg('id', () => ID) id: string,
    @Ctx() ctx: Context
  ): Promise<boolean> {
    return this.repositoryService.delete(id, ctx);
  }

  @Mutation(() => Repository)
  async starRepository(
    @Arg('id', () => ID) id: string,
    @Ctx() ctx: Context
  ): Promise<Repository> {
    return this.repositoryService.star(id, ctx);
  }

  @Mutation(() => Repository)
  async forkRepository(
    @Arg('id', () => ID) id: string,
    @Arg('newOwnerId', () => ID) newOwnerId: string,
    @Ctx() ctx: Context
  ): Promise<Repository> {
    return this.repositoryService.fork(id, newOwnerId, ctx);
  }
}
