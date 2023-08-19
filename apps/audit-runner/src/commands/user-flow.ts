import { ArgumentsCamelCase, CommandBuilder, CommandModule } from 'yargs';
import { createAuditQueue, UserFlowExecutor } from '@ufo/cli-middleware';
import { AuditExecutor, AuditQueue, AuditStore } from '@ufo/cli-interfaces';
import { queue, QueueOption } from '../args';
import { GlobalOptions } from '../args';

type UserFlowCommandOptions = GlobalOptions & QueueOption;

const userFlowBuilder: CommandBuilder = { queue };

const userFlowHandler = async (args: ArgumentsCamelCase<GlobalOptions & QueueOption>): Promise<void> => {
  const auditQueue: AuditQueue = await createAuditQueue(args.queue);
  const auditStore = {} as AuditStore;
  const audit: AuditExecutor = new UserFlowExecutor(auditQueue, auditStore);
  args.dryRun || await audit.exec();
};

export const userFlowCommand: CommandModule<NonNullable<unknown>, UserFlowCommandOptions> = {
  command: 'user-flow',
  describe: 'Load, Run and Store user-flow audits',
  aliases: 'uf',
  builder: userFlowBuilder,
  handler: userFlowHandler,
}
