import { MigrationInterface, QueryRunner, Index } from 'typeorm';

export class AddUserIndexes1700000000001 implements MigrationInterface {
  name = 'AddUserIndexes1700000000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add composite index for better query performance
    await queryRunner.createIndex(
      'users',
      new Index('IDX_USER_CREATED_AT', ['createdAt']),
    );

    await queryRunner.createIndex(
      'repositories',
      new Index('IDX_REPO_CREATED_AT', ['createdAt']),
    );

    await queryRunner.createIndex(
      'repositories',
      new Index('IDX_REPO_STARS', ['starsCount']),
    );

    await queryRunner.createIndex(
      'repositories',
      new Index('IDX_REPO_LANGUAGE', ['language']),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropIndex('repositories', 'IDX_REPO_LANGUAGE');
    await queryRunner.dropIndex('repositories', 'IDX_REPO_STARS');
    await queryRunner.dropIndex('repositories', 'IDX_REPO_CREATED_AT');
    await queryRunner.dropIndex('users', 'IDX_USER_CREATED_AT');
  }
}
