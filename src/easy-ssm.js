import 'babel-polyfill';
import AWS from 'aws-sdk';
import Logger from './logger';
import SendCommand from './send-command';
import GetOutput from './get-output';

export default class EasySSM {
  constructor(params = {}) {
    const defaultParams = {
      ssm: null,
      s3: null,
      maxRetries: 3,
      timeoutSec: 60,
      OutputS3BucketName: null,
      OutputS3KeyPrefix: '',
      logger: null
    };
    this.params = Object.assign(defaultParams, params);
    if (!this.params.ssm) {
      this.params.ssm = new AWS.SSM({region: process.env.AWS_DEFAULT_REGION});
    }
    if (!this.params.s3) {
      this.params.s3 = new AWS.S3({region: process.env.AWS_DEFAULT_REGION});
    }
    if (this.params.logger) {
      this.params.logger = new Logger(this.params.logger);
    } else {
      this.params.logger = new Logger(null);
    }
    this.logger = this.params.logger;
  }

  async runPromise(instance_ids, command) {
    const sc = new SendCommand(this.params);
    const invocationResult = await sc.run(instance_ids, command);
    this.logger.log(JSON.stringify(invocationResult, null, 4));
    return await new GetOutput(this.params).run(invocationResult);
  }

  run(instance_ids, command, callback) {
    this.runPromise(instance_ids, command).then(ret => {
      callback(null, ret);
    }).catch(err => {
      callback(err, null);
    });
  }
}