#! /usr/bin/env node

const chalk         = require('chalk');
const cli           = require('ember-cli');
const fs            = require('fs');

let enableLog = false;
let failures  = 0;

function wrapStream(stream) {
  const _write = stream.write.bind(stream);
  const _print = (txt) => _write(txt + "\n");

  stream.write = (input) => {
    const lines = input.toString().split('\n');
    lines.forEach((l) => {

      if (/^ok /.test(l)) {
        // Print successful tests in blue and disable further logs
        _print(chalk.magenta(l));
        enableLog = false;
        return;
      }

      if (/^not ok /.test(l)) {
        // Print failed tests in red and allow further logs for details
        l = chalk.red(l);
        enableLog = true;
        failures++;
      }

      if (enableLog && /Log: /.test(l)) {
        // Test logs are too verbose, remove them
        _print(l.replace(/Log: .*$/, ''));
        enableLog = false;
      }

      if (enableLog) {
        _print(l);
      }
    });
  };
  return _print;
}

wrapStream(process.stderr);
const log = wrapStream(process.stdout);


log(chalk.cyan('Ember tests are running...'));
cli({
  inputStream: process.stdin,
  outputStream: process.stdout,
  errorStream: process.stderr,
  root: process.cwd(),
  cliArgs: ['test']
}).then(() => {
  log(chalk.yellow('-----'));
  log(chalk.yellow('----- RESULTS:'));
  log(chalk.yellow(`----- Testing completed with ${failures} Failures`));
  log(chalk.yellow('-----'));
  process.exit(0);
});