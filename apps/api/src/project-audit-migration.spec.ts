import { readFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';

it('migrates Postgres audit ownership without assigning existing public history', async () => {
  const db = new PGlite();
  try {
    for (const file of [
      '0000_great_excalibur',
      '0001_remarkable_texas_twister',
      '0002_tranquil_pestilence',
      '0003_thick_forgotten_one',
      '0004_workspaces_and_projects',
      '0005_workspace_logo',
    ])
      await db.exec(await readFile(new URL(`../migrations/${file}.sql`, import.meta.url), 'utf8'));
    await db.exec(`INSERT INTO audit_templates(id,kind,title) VALUES
      ('00000000-0000-4000-8000-000000000001','user-flow','Existing public audit');
      INSERT INTO audit_runs(template_id) VALUES ('00000000-0000-4000-8000-000000000001');`);
    await db.exec(await readFile(new URL('../migrations/0006_project_audit_scope.sql', import.meta.url), 'utf8'));
    expect((await db.query('SELECT project_id FROM audit_runs')).rows).toEqual([{ project_id: null }]);
    // Ownership remains a durable privacy marker even if its project is later removed.
    await db.exec(`UPDATE audit_runs SET project_id='deleted-project';`);
    expect((await db.query('SELECT project_id FROM audit_runs')).rows).toEqual([{ project_id: 'deleted-project' }]);
  } finally {
    await db.close();
  }
}, 30000);
