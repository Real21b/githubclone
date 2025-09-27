import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository as TypeOrmRepository } from 'typeorm';
import { Repository } from './repository.entity';

@Injectable()
export class RepositoryService {
  constructor(
    @InjectRepository(Repository)
    private repositoryRepository: TypeOrmRepository<Repository>,
  ) {}

  async create(repositoryData: Partial<Repository>): Promise<Repository> {
    const repository = this.repositoryRepository.create(repositoryData);
    return this.repositoryRepository.save(repository);
  }

  async findAll(): Promise<Repository[]> {
    return this.repositoryRepository.find({
      relations: ['owner']
    });
  }

  async findById(id: string): Promise<Repository> {
    const repository = await this.repositoryRepository.findOne({
      where: { id },
      relations: ['owner']
    });
    if (!repository) {
      throw new NotFoundException('Repository not found');
    }
    return repository;
  }

  async findByOwner(ownerId: string): Promise<Repository[]> {
    return this.repositoryRepository.find({
      where: { ownerId },
      relations: ['owner']
    });
  }

  async update(id: string, updateData: Partial<Repository>): Promise<Repository> {
    await this.repositoryRepository.update(id, updateData);
    return this.findById(id);
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.repositoryRepository.delete(id);
    return result.affected > 0;
  }

  async star(id: string): Promise<Repository> {
    const repository = await this.findById(id);
    repository.starsCount += 1;
    return this.repositoryRepository.save(repository);
  }

  async fork(id: string, newOwnerId: string): Promise<Repository> {
    const originalRepository = await this.findById(id);
    originalRepository.forksCount += 1;
    await this.repositoryRepository.save(originalRepository);

    const forkedRepository = this.repositoryRepository.create({
      name: originalRepository.name,
      description: originalRepository.description,
      isPrivate: originalRepository.isPrivate,
      language: originalRepository.language,
      defaultBranch: originalRepository.defaultBranch,
      ownerId: newOwnerId,
    });

    return this.repositoryRepository.save(forkedRepository);
  }
}
