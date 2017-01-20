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
      timeoutSec: 1000,
      OutputS3BucketName: null,
      OutputS3KeyPrefix: '',
    };
    this.params = Object.assign({}, defaultParams, params);
    if (params.logger) {
      this.params.logger = new Logger(params.logger);
    } else {
      this.params.logger = new Logger(null);
    }
    this.logger = this.params.logger;
    if (!this.params.ssm) {
      const ssmRegion = this.params.ssmRegion || process.env.AWS_DEFAULT_REGION;
      this.logger.log("SSM Region:" + ssmRegion);
      this.params.ssm = new AWS.SSM({region: ssmRegion});
    }
    if (!this.params.s3) {
      const bucketRegion = this.params.bucketRegion || process.env.AWS_DEFAULT_REGION;
      this.logger.log("S3 Region:" + bucketRegion);
      this.params.s3 = new AWS.S3({region: bucketRegion});
    }
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
