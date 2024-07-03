import { CommandModule, CommandBuilder, Options, InferredOptionTypes, Argv } from 'yargs';
import { Metafile } from 'esbuild';
import {
  extractEntryPoints,
  filterMetaFromEntryPoints,
  removeDynamicImports,
  getJson,
  makeJson,
} from './utils.js';

export const DEMAND_STATS_PATH = 'The path to a stats.json file is required';

const statsPath = {
  alias: 's',
  type: 'string',
  description: 'The path to the stats.json file',
  demandOption: DEMAND_STATS_PATH,
} as const satisfies Options;

const outPath = {
  alias: 'o',
  type: 'string',
  description: 'The path where the new file should be saved',
  default: 'initial-stats.json'
} as const satisfies Options;

const excludeDynamicImports = {
  alias: 'eDI',
  type: 'boolean',
  description: 'Should the dynamic imports be filtered out of the output chunk imports',
  default: false,
} as const satisfies Options;

const entryPoints = {
  alias: 'e',
  type: 'array',
  default: ['main-', 'polyfills-'],
  coerce: (i) => i.map((value: never) => String(value)),
  description: 'Entry points that should be considered for the bundle',
} as const satisfies Options;

const filterMetaOptions = { statsPath, outPath, excludeDynamicImports, entryPoints };

type FilterMetaOptions = InferredOptionTypes<typeof filterMetaOptions>;
type FilterMetaCommandModule = CommandModule<unknown, FilterMetaOptions>;

const filterMetaBuilder: CommandBuilder<unknown, FilterMetaOptions> = (argv: Argv<unknown>) => {
  return argv.options(filterMetaOptions);
}

const filterMetaHandler: FilterMetaCommandModule['handler'] = (argv: FilterMetaOptions) => {
  const meta = getJson<Metafile>(argv.statsPath);
  const entryPoints = extractEntryPoints(meta, argv.entryPoints);
  filterMetaFromEntryPoints(meta, entryPoints);
  if (argv.excludeDynamicImports) {
    removeDynamicImports(meta);
  }
  makeJson(argv.outPath, meta);
  console.log('Filtered Meta File was successfully created as ' + argv.outPath);
}

export const filterMetaCommand: FilterMetaCommandModule = {
  command: 'filter',
  describe: 'Filters the meta file to only include chunks required by specified entry points',
  aliases: 'f',
  builder: filterMetaBuilder,
  handler: filterMetaHandler
}
