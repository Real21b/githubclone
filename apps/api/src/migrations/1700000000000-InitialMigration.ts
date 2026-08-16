import {
  type MigrationInterface,
  type QueryRunner,
  Table,
  TableForeignKey,
  TableIndex,
} from 'typeorm';

export class InitialMigration1700000000000 implements MigrationInterface {
  name = 'InitialMigration1700000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create users table
    await queryRunner.createTable(
      new Table({
        name: 'users',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'username',
            type: 'varchar',
            length: '50',
            isUnique: true,
            isNullable: false,
          },
          {
            name: 'email',
            type: 'varchar',
            length: '100',
            isUnique: true,
            isNullable: false,
          },
          {
            name: 'password',
            type: 'varchar',
            length: '255',
            isNullable: false,
          },
          {
            name: 'bio',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'avatar',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'followersCount',
            type: 'int',
            default: 0,
            isNullable: false,
          },
          {
            name: 'followingCount',
            type: 'int',
            default: 0,
            isNullable: false,
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            isNullable: false,
          },
          {
            name: 'updatedAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
            isNullable: false,
          },
        ],
      }),
      true,
    );

    // Create repositories table
    await queryRunner.createTable(
      new Table({
        name: 'repositories',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'name',
            type: 'varchar',
            length: '100',
            isNullable: false,
          },
          {
            name: 'description',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'isPrivate',
            type: 'boolean',
            default: false,
            isNullable: false,
          },
          {
            name: 'starsCount',
            type: 'int',
            default: 0,
            isNullable: false,
          },
          {
            name: 'forksCount',
            type: 'int',
            default: 0,
            isNullable: false,
          },
          {
            name: 'watchersCount',
            type: 'int',
            default: 0,
            isNullable: false,
          },
          {
            name: 'language',
            type: 'varchar',
            length: '50',
            isNullable: true,
          },
          {
            name: 'defaultBranch',
            type: 'varchar',
            length: '50',
            default: "'main'",
            isNullable: false,
          },
          {
            name: 'ownerId',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            isNullable: false,
          },
          {
            name: 'updatedAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
            isNullable: false,
          },
        ],
      }),
      true,
    );

    // Create foreign key constraint
    await queryRunner.createForeignKey(
      'repositories',
      new TableForeignKey({
        columnNames: ['ownerId'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      }),
    );

    // Create indexes for better performance
    await queryRunner.createIndex(
      'users',
      new TableIndex({ name: 'IDX_USER_USERNAME', columnNames: ['username'] }),
    );

    await queryRunner.createIndex(
      'users',
      new TableIndex({ name: 'IDX_USER_EMAIL', columnNames: ['email'] }),
    );

    await queryRunner.createIndex(
      'repositories',
      new TableIndex({ name: 'IDX_REPO_OWNER', columnNames: ['ownerId'] }),
    );

    await queryRunner.createIndex(
      'repositories',
      new TableIndex({ name: 'IDX_REPO_NAME_OWNER', columnNames: ['name', 'ownerId'] }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes
    await queryRunner.dropIndex('repositories', 'IDX_REPO_NAME_OWNER');
    await queryRunner.dropIndex('repositories', 'IDX_REPO_OWNER');
    await queryRunner.dropIndex('users', 'IDX_USER_EMAIL');
    await queryRunner.dropIndex('users', 'IDX_USER_USERNAME');

    // Drop foreign key
    const repositoriesTable = await queryRunner.getTable('repositories');
    const foreignKey = repositoriesTable?.foreignKeys.find(
      (fk) => fk.columnNames.indexOf('ownerId') !== -1,
    );
    if (foreignKey) {
      await queryRunner.dropForeignKey('repositories', foreignKey);
    }

    // Drop tables
    await queryRunner.dropTable('repositories');
    await queryRunner.dropTable('users');
  }
}
