import { defineConfig } from 'cypress';
import { Client } from 'pg';
import base from './cypress.config';

const captureClient = () => {
  const connectionString = process.env['DATABASE_URL'];
  if (
    process.env['APP_SPEED_DEMO_CAPTURE'] !== 'true' ||
    !connectionString ||
    !/^\/app_speed_e2e_\d+_\d+$/.test(new URL(connectionString).pathname)
  ) {
    throw new Error('Capture fixtures require an isolated database created by the journey capture target.');
  }
  return new Client({ connectionString });
};

export default defineConfig({
  ...base,
  video: false,
  e2e: {
    ...base.e2e,
    specPattern: 'journeys/**/*.cy.ts',
    async setupNodeEvents(on, config) {
      await base.e2e?.setupNodeEvents?.(on, config);
      on('task', {
        async captureReset() {
          const client = captureClient();
          await client.connect();
          try {
            await client.query(
              'TRUNCATE audit_occurrences, audit_shares, user_flow_audit_results, audit_results, audit_runs, audit_schedules, audit_versions, user_flow_audit_templates, audit_templates, audit_spaces CASCADE',
            );
            return null;
          } finally {
            await client.end();
          }
        },
        async captureHistory({ scheduleId, runId }: { scheduleId: string; runId: string }) {
          const client = captureClient();
          await client.connect();
          try {
            await client.query('BEGIN');
            const { rows } = await client.query('SELECT template_id, version_id FROM audit_schedules WHERE id=$1', [
              scheduleId,
            ]);
            const schedule = rows[0];
            if (!schedule) throw new Error('Unknown capture schedule.');
            await client.query('UPDATE audit_runs SET schedule_id=$1 WHERE id=$2', [scheduleId, runId]);
            await client.query(
              "INSERT INTO audit_occurrences(schedule_id,due_at,outcome,run_id,version_id) VALUES($1,now()-interval '45 minutes','dispatched',$2,$3)",
              [scheduleId, runId, schedule.version_id],
            );
            const failed = await client.query(
              "INSERT INTO audit_runs(template_id,version_id,schedule_id,status,created_at,completed_at,duration_ms) VALUES($1,$2,$3,'COMPLETE',now()-interval '30 minutes',now()-interval '29 minutes',12000) RETURNING id",
              [schedule.template_id, schedule.version_id, scheduleId],
            );
            await client.query("INSERT INTO audit_results(run_id,status,error) VALUES($1,'FAILURE',$2)", [
              failed.rows[0].id,
              { name: 'NavigationTimeout', message: 'The checkout page did not become ready within 30 seconds.' },
            ]);
            await client.query(
              "INSERT INTO audit_occurrences(schedule_id,due_at,outcome,run_id,version_id) VALUES($1,now()-interval '30 minutes','dispatched',$2,$3)",
              [scheduleId, failed.rows[0].id, schedule.version_id],
            );
            await client.query(
              "INSERT INTO audit_occurrences(schedule_id,due_at,outcome,version_id) VALUES($1,now()-interval '20 minutes','overlap',$2)",
              [scheduleId, schedule.version_id],
            );
            await client.query(
              "INSERT INTO audit_occurrences(schedule_id,due_at,through_at,count,outcome,version_id) VALUES($1,now()-interval '15 minutes',now()-interval '5 minutes',3,'missed',$2)",
              [scheduleId, schedule.version_id],
            );
            await client.query('COMMIT');
            return null;
          } catch (error) {
            await client.query('ROLLBACK');
            throw error;
          } finally {
            await client.end();
          }
        },
      });
      return config;
    },
  },
});
