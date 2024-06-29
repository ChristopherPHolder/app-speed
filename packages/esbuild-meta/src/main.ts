#!/usr/bin/env node

import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { argv } from 'node:process';
import { filterMetaCommand } from './lib/filter-meta.js';

yargs(hideBin(argv)).command('$0', 'Default Command is filter', filterMetaCommand).parse();

console.log('Esbuild Meta Completed Successfully.');
