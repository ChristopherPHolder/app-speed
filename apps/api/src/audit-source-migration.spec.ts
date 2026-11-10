import { readFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';

it('migrates Postgres audit runs to portal-sourced history and stores MCP attribution', async () => {
  const db = new PGlite();
  try {
    for (const file of [
      '0000_great_excalibur',
      '0001_remarkable_texas_twister',
      '0002_tranquil_pestilence',
      '0003_thick_forgotten_one',
      '0004_workspaces_and_projects',
      '0005_workspace_logo',
      '0006_project_audit_scope',
    ])
      await db.exec(await readFile(new URL(`../migrations/${file}.sql`, import.meta.url), 'utf8'));
    await db.exec(`INSERT INTO audit_templates(id,kind,title) VALUES
      ('00000000-0000-4000-8000-000000000001','user-flow','Existing audit');
      INSERT INTO audit_runs(template_id) VALUES ('00000000-0000-4000-8000-000000000001');`);
    await db.exec(await readFile(new URL('../migrations/0007_audit_run_source.sql', import.meta.url), 'utf8'));
    expect((await db.query('SELECT source, client_id, client_name FROM audit_runs')).rows).toEqual([
      { source: 'portal', client_id: null, client_name: null },
    ]);
    await db.exec(`INSERT INTO audit_runs(template_id, source, client_id, client_name) VALUES
      ('00000000-0000-4000-8000-000000000001','mcp','https://chatgpt.com/oauth/client.json','ChatGPT');`);
    expect((await db.query("SELECT client_name FROM audit_runs WHERE source='mcp'")).rows).toEqual([
      { client_name: 'ChatGPT' },
    ]);
  } finally {
    await db.close();
  }
}, 30000);
