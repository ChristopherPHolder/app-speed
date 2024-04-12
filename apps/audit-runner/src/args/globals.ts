import { DryRunOption, dryRun } from './dry-run';
import { HelpOption, help } from './help';
import { ShutdownOption, shutdown } from './shutdown';
import { VerboseOption, verbose } from './verbose';

export type GlobalOptions = DryRunOption & HelpOption & ShutdownOption & VerboseOption;
export { dryRun, help, shutdown, verbose };
