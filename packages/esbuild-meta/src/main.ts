#!/usr/bin/env node

import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { argv } from 'node:process';
import { filterMetaCommand } from './lib/filter-meta.js';
import { version } from '../package.json';

yargs(hideBin(argv))
  .scriptName('esbuild-meta')
  .version(version).alias('v', 'version')
  .showHelpOnFail(true)
  .command(filterMetaCommand)
  .help()
  .alias('h', 'help')
  .wrap(null)
  .parse();
