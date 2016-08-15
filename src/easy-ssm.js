import 'babel-polyfill';
import AWS from 'aws-sdk';
import Logger from './logger';
import SendCommand from './send-command';

export default class EasySSM {
  constructor(awsSdkSsmObject = null, timeoutSec = 60) {
    if (awsSdkSsmObject) {
      this.ssm = awsSdkSsmObject;
    } else {
      this.ssm = new AWS.SSM({region: 'ap-northeast-1'});
    }
    this.timeoutSec = timeoutSec;
    this.maxRetries = 0;
    this.logger = new Logger(process.stdout);
  }

  async runPromise(instance_ids, command) {
    const sc = new SendCommand(this.ssm, this.timeoutSec, this.maxRetries, this.logger);
    return await sc.run(instance_ids, command);
  }

  run(instance_ids, command, callback) {
    this.runPromise(instance_ids, command).then(ret => {
      callback(null, ret);
    }).catch(err => {
      callback(err, null);
    });
  }
}

