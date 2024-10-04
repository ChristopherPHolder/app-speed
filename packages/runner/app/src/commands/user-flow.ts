import { ArgumentsCamelCase, CommandBuilder, CommandModule } from 'yargs';
import { createAuditQueue, createAuditStore, UserFlowExecutor } from '@app-speed/cli-middleware';
import { AuditExecutor, AuditQueue, AuditStore } from '@app-speed/cli-interfaces';
import { GlobalOptions, queue, QueueOption, store, StoreOption } from '../args';

type UserFlowCommandOptions = GlobalOptions & QueueOption & StoreOption;

const userFlowBuilder: CommandBuilder = { queue, store };

const userFlowHandler = async (args: ArgumentsCamelCase<UserFlowCommandOptions>): Promise<void> => {
  const auditQueue: AuditQueue = await createAuditQueue(args.queue);
  const auditStore: AuditStore = createAuditStore(args.store);
  const audit: AuditExecutor = new UserFlowExecutor(auditQueue, auditStore);
  args.dryRun || (await audit.exec());
};

export const userFlowCommand: CommandModule<NonNullable<unknown>, UserFlowCommandOptions> = {
  command: 'user-flow',
  describe: 'Load, Run and Store user-flow audits',
  aliases: 'uf',
  builder: userFlowBuilder,
  handler: userFlowHandler,
};
