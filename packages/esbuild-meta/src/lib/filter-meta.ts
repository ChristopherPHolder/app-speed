import { CommandModule, CommandBuilder, Options, InferredOptionTypes, Argv } from 'yargs';
import {
  extractEntryFromManifest,
  filterMetaFromEntryPoints,
  getJson,
  makeJson,
  removeDynamicImports,
} from './utils.js';

const distPath = {
  alias: 'd',
  type: 'string',
  default: 'dist',
  description: 'The path to the dist folder'
} as const satisfies Options;

const appDist = {
  alias: 'ad',
  type: 'string',
  default: '',
  description: 'The path to the dist folder of the build excluding base dist',
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
  default: true,
} as const satisfies Options

const filterMetaOptions = { distPath, appDist, outPath, excludeDynamicImports };

type FilterMetaOptions = InferredOptionTypes<typeof filterMetaOptions>;
type FilterMetaCommandModule = CommandModule<unknown, FilterMetaOptions>;

const filterMetaBuilder: CommandBuilder<unknown, FilterMetaOptions> = (argv: Argv<unknown>) => {
  return argv.options(filterMetaOptions);
}

const filterMetaHandler: FilterMetaCommandModule['handler'] = (argv: FilterMetaOptions) => {
  const manifest = getJson([argv.distPath, argv.appDist, 'manifest.json']);
  const entryPoints = extractEntryFromManifest(manifest);
  const meta = getJson([argv.distPath, argv.appDist, 'stats.json']);
  filterMetaFromEntryPoints(meta, entryPoints);
  if (argv.excludeDynamicImports) {
    removeDynamicImports(meta);
  }
  makeJson(argv.outPath, meta);
  console.log('Filter Meta File was successfully created as ' + argv.outPath);
}

export const filterMetaCommand: FilterMetaCommandModule = {
  command: 'filter',
  describe: 'Filters the meta file to only include chunks required by specified entry points',
  aliases: 'f',
  builder: filterMetaBuilder,
  handler: filterMetaHandler
}
