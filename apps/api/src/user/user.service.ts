import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcryptjs';
import { Repository } from 'typeorm';
import { CacheService } from '../cache/cache.service';
import { User } from './user.entity';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private cacheService: CacheService,
  ) {}

  async create(userData: Partial<User>): Promise<User> {
    const hashedPassword = await bcrypt.hash(userData.password, 10);
    const user = this.userRepository.create({
      ...userData,
      password: hashedPassword,
    });
    const savedUser = await this.userRepository.save(user);

    // Cache the new user
    await this.cacheService.set(this.cacheService.getUserKey(savedUser.id), savedUser, 3600);
    await this.cacheService.set(
      this.cacheService.getUserByUsernameKey(savedUser.username),
      savedUser,
      3600,
    );
    await this.cacheService.set(
      this.cacheService.getUserByEmailKey(savedUser.email),
      savedUser,
      3600,
    );

    // Invalidate users list cache
    await this.cacheService.del(this.cacheService.getAllUsersKey());

    return savedUser;
  }

  async findByEmail(email: string): Promise<User | null> {
    // Try cache first
    const cacheKey = this.cacheService.getUserByEmailKey(email);
    const cachedUser = await this.cacheService.get<User>(cacheKey);
    if (cachedUser) {
      return cachedUser;
    }

    // If not in cache, get from database
    const user = await this.userRepository.findOne({ where: { email } });
    if (user) {
      await this.cacheService.set(cacheKey, user, 3600);
    }
    return user;
  }

  async findByUsername(username: string): Promise<User | null> {
    // Try cache first
    const cacheKey = this.cacheService.getUserByUsernameKey(username);
    const cachedUser = await this.cacheService.get<User>(cacheKey);
    if (cachedUser) {
      return cachedUser;
    }

    // If not in cache, get from database
    const user = await this.userRepository.findOne({ where: { username } });
    if (user) {
      await this.cacheService.set(cacheKey, user, 3600);
    }
    return user;
  }

  async findById(id: string): Promise<User> {
    // Try cache first
    const cacheKey = this.cacheService.getUserKey(id);
    const cachedUser = await this.cacheService.get<User>(cacheKey);
    if (cachedUser) {
      return cachedUser;
    }

    // If not in cache, get from database
    const user = await this.userRepository.findOne({
      where: { id },
      relations: ['repositories'],
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Cache the user
    await this.cacheService.set(cacheKey, user, 3600);
    return user;
  }

  async findAll(): Promise<User[]> {
    // Try cache first
    const cacheKey = this.cacheService.getAllUsersKey();
    const cachedUsers = await this.cacheService.get<User[]>(cacheKey);
    if (cachedUsers) {
      return cachedUsers;
    }

    // If not in cache, get from database
    const users = await this.userRepository.find({
      relations: ['repositories'],
    });

    // Cache the users list
    await this.cacheService.set(cacheKey, users, 1800); // 30 minutes cache
    return users;
  }

  async update(id: string, updateData: Partial<User>): Promise<User> {
    await this.userRepository.update(id, updateData);

    // Invalidate cache
    await this.cacheService.del(this.cacheService.getUserKey(id));
    await this.cacheService.del(this.cacheService.getAllUsersKey());

    return this.findById(id);
  }

  async validatePassword(password: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
  }
}
