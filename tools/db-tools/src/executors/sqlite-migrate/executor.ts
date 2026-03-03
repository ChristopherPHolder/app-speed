import { ExecutorContext, logger, type PromiseExecutor } from '@nx/devkit';
import * as fs from 'node:fs';
import * as path from 'node:path';
import DatabaseConstructor = require('better-sqlite3');

import { type SqliteMigrateExecutorSchema } from './schema';

const MIGRATION_TABLE_NAME = '__app_speed_migrations';

const resolveSqliteFile = (databaseUrl: string, workspaceRoot: string): string => {
  if (databaseUrl.startsWith('file:')) {
    const filePath = databaseUrl.slice('file:'.length);
    return path.isAbsolute(filePath) ? filePath : path.resolve(workspaceRoot, filePath);
  }

  if (path.isAbsolute(databaseUrl)) {
    return databaseUrl;
  }

  return path.resolve(workspaceRoot, databaseUrl);
};

const collectMigrationFiles = (migrationsRoot: string): string[] =>
  fs
    .readdirSync(migrationsRoot, { withFileTypes: true })
    .flatMap((entry) => {
      const fullPath = path.join(migrationsRoot, entry.name);

      if (entry.isDirectory()) {
        return collectMigrationFiles(fullPath);
      }

      if (entry.isFile() && entry.name.endsWith('.sql')) {
        return [fullPath];
      }

      return [];
    })
    .sort((left, right) => left.localeCompare(right));

const runExecutor: PromiseExecutor<SqliteMigrateExecutorSchema> = async (options, context: ExecutorContext) => {
  const workspaceRoot = context.root ?? process.cwd();
  const migrationsRoot = path.resolve(workspaceRoot, options.migrationsDir);

  if (!fs.existsSync(migrationsRoot)) {
    logger.error(`Migrations directory not found: ${migrationsRoot}`);
    return { success: false };
  }

  const databaseUrl = options.databaseUrl ?? process.env.DATABASE_URL ?? 'file:./tmp/dev.db';
  const sqliteFile = resolveSqliteFile(databaseUrl, workspaceRoot);
  const migrationFiles = collectMigrationFiles(migrationsRoot);

  fs.mkdirSync(path.dirname(sqliteFile), { recursive: true });

  const client = new DatabaseConstructor(sqliteFile);

  try {
    client.pragma('foreign_keys = ON');
    client.pragma('journal_mode = WAL');
    client.exec(
      `CREATE TABLE IF NOT EXISTS "${MIGRATION_TABLE_NAME}" ("name" TEXT NOT NULL PRIMARY KEY, "createdAt" INTEGER NOT NULL)`,
    );

    const appliedMigrations = new Set(
      (client.prepare(`SELECT name FROM "${MIGRATION_TABLE_NAME}"`).all() as Array<{ name: string }>).map(
        (row) => row.name,
      ),
    );

    const insertMigration = client.prepare(`INSERT INTO "${MIGRATION_TABLE_NAME}" ("name", "createdAt") VALUES (?, ?)`);

    for (const migrationFile of migrationFiles) {
      const migrationName = path.relative(migrationsRoot, migrationFile).replace(/\\/g, '/');

      if (appliedMigrations.has(migrationName)) {
        continue;
      }

      const migrationSql = fs.readFileSync(migrationFile, 'utf8');
      const applyMigration = client.transaction((name: string, sql: string) => {
        client.exec(sql);
        insertMigration.run(name, Date.now());
      });

      applyMigration(migrationName, migrationSql);
      logger.info(`Applied migration ${migrationName}`);
    }

    return { success: true };
  } catch (error) {
    logger.error(`Failed to apply migrations: ${String(error)}`);
    return { success: false };
  } finally {
    client.close();
  }
};

export default runExecutor;
