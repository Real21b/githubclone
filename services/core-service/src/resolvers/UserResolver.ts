import { Resolver, Query, Mutation, Arg, ID, Ctx } from 'type-graphql';
import { User } from '../entities/User';
import { CreateUserInput } from '../inputs/CreateUserInput';
import { UpdateUserInput } from '../inputs/UpdateUserInput';
import { Context } from '../types/Context';
import { UserService } from '../services/UserService';

@Resolver(() => User)
export class UserResolver {
  private userService: UserService;

  constructor() {
    this.userService = new UserService();
  }

  @Query(() => [User], { name: 'users' })
  async getUsers(@Ctx() ctx: Context): Promise<User[]> {
    return this.userService.findAll(ctx);
  }

  @Query(() => User, { name: 'user' })
  async getUser(
    @Arg('id', () => ID) id: string,
    @Ctx() ctx: Context
  ): Promise<User> {
    return this.userService.findById(id, ctx);
  }

  @Query(() => User, { name: 'userByUsername' })
  async getUserByUsername(
    @Arg('username') username: string,
    @Ctx() ctx: Context
  ): Promise<User> {
    return this.userService.findByUsername(username, ctx);
  }

  @Mutation(() => User)
  async createUser(
    @Arg('input') input: CreateUserInput,
    @Ctx() ctx: Context
  ): Promise<User> {
    return this.userService.create(input, ctx);
  }

  @Mutation(() => User)
  async updateUser(
    @Arg('id', () => ID) id: string,
    @Arg('input') input: UpdateUserInput,
    @Ctx() ctx: Context
  ): Promise<User> {
    return this.userService.update(id, input, ctx);
  }

  @Mutation(() => Boolean)
  async deleteUser(
    @Arg('id', () => ID) id: string,
    @Ctx() ctx: Context
  ): Promise<boolean> {
    return this.userService.delete(id, ctx);
  }
}
