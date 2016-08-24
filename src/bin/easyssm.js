#! /usr/bin/env node

import program from 'commander';
import EasySSM from '../easy-ssm';
const version = require('../../package.json').version;

class Cli {
  async main() {
    try {
      program
        .version(version)
        .usage('[options] <instance id> <command...>')
        .option('-b, --bucket <bucket>', 'S3 bucket name')
        .option('-k, --key-prefix <keyPrefix>', 'S3 key prefix', '')
        .option('-o, --output <format>', 'specify output format (pretty|raw|json) [pretty]', 'pretty')
        .option('--debug', 'show debug info');
      program.parse(process.argv);
      if (program.args.length < 2) {
        program.help();
        process.exit(1);
      }
      const instanceId = program.args[0];
      const command = program.args.slice(1).join(' ');

      const params = {};
      if (program.debug) {
        params.logger = process.stderr;
      }
      if (program.bucket) {
        params.OutputS3BucketName = program.bucket;
        params.OutputS3KeyPrefix = program.keyPrefix;
      }
      const easySsm = new EasySSM(params);
      const output = await easySsm.runPromise(instanceId, command);
      if (program.output === 'pretty') {
        this.outputPretty(output);
      } else if (program.output === 'raw') {
        this.outputRaw(output);
      } else if (program.output === 'json') {
        this.outputJson(output);
      } else {
        throw new Error('Unknown output format.');
      }
    } catch (e) {
      console.log(e);
      process.exit(1);
    }
  }

  outputPretty(output) {
    console.log('SSM RunShellScript status:' + output.ssmRunShellScriptStatus);
    console.log('              Exit status:' + output.exitStatus);
    console.log('');
    console.log('------- stdout -------');
    console.log(output.stdout);
    console.log('------- stderr -------');
    console.log(output.stderr);
  }

  outputRaw(output) {
    process.stdout.write(output.stdout);
    process.stderr.write(output.stderr);
    process.exitCode = output.exitStatus;
  }

  outputJson(output) {
    console.log(JSON.stringify(output, null, 4));
  }
}

new Cli().main().then();