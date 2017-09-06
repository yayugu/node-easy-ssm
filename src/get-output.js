import util from 'util';

export default class GetOutput {
  constructor(params) {
    this.s3 = params.s3;
    this.timeoutSec = params.timeoutSec;
    this.maxRetries = params.maxRetries;
    this.logger = params.logger;
  }

  async run(invocationResult) {
    const ret = invocationResult.CommandInvocations[0];
    this.logger.log(JSON.stringify(ret, null, 4));
    const bucket = ret.CommandPlugins[0].OutputS3BucketName;
    const exitStatus = ret.CommandPlugins[0].ResponseCode;
    const status = ret.CommandPlugins[0].Status;
    const summarizedOutput = this.parseInvocationResultOutput(ret.CommandPlugins[0].Output, status);
    if (!bucket) {
      this.logger.log('S3 Bucket is not specified. Try to parse SSM:ListCommandInvocation result... Long output may summarized.');
      return Object.assign(summarizedOutput, {
        exitStatus: exitStatus,
        ssmRunShellScriptStatus: status,
      });
    }
    const keyPrefix = ret.CommandPlugins[0].OutputS3KeyPrefix;
    const stdoutKey = keyPrefix + '/0.awsrunShellScript/stdout';
    const stderrKey = keyPrefix + '/0.awsrunShellScript/stderr';

    try {
      let stdout = summarizedOutput.stdout;
      let stderr = summarizedOutput.stderr;
      if (stdout.length > 0) {
        await this.s3WaitFor(bucket, stdoutKey);
        stdout = (await this.s3Get(bucket, stdoutKey)).Body.toString();
      }
      if (stderr.length > 0) {
        await this.s3WaitFor(bucket, stderrKey);
        stderr = (await this.s3Get(bucket, stderrKey)).Body.toString();
      }
      return {
        stdout: stdout,
        stderr: stderr,
        exitStatus: exitStatus,
        ssmRunShellScriptStatus: status,
      };
    } catch (e) {
      const error = new Error('get stdout & stderr from S3 failed: ' + e.toString())
      error.parentError = e;
      throw error;
    }
  }

  s3WaitFor(bucket, key) {
    return new Promise((resolve, reject) => {
      const params = {
        Bucket: bucket,
        Key: key,
      };
      // 5sec interval, 20times
      // Note: aws-sdk waitFor can't customize interval and maxAttempted.
      // see https://github.com/aws/aws-sdk-js/issues/881
      this.logger.log('Waiting until object(s3://' + bucket + '/' + key + ') uploaded. Call S3:HeadObject');
      this.s3.waitFor('objectExists', params, (err, _) => {
        if (err) {
          reject(err);
          return;
        }
        resolve();
      });
    });
  }

  s3Get(bucket, key) {
    return new Promise((resolve, reject) => {
      const params = {
        Bucket: bucket,
        Key: key,
      };
      this.logger.log('Call S3:GetObject');
      this.s3.getObject(params, (err, data) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(data);
        this.logger.log('S3:GetObject response:');
        this.logger.log(util.inspect(data, {depth: 2}));
      });
    });
  }

  parseInvocationResultOutput (output, status) {
    if (output === undefined) {
      output = '';
    }
    const a = output.split("\n----------ERROR-------\n");
    const stdout = a[0];
    let stderr = a[1] === undefined ? '' : a[1];
    if (status === 'Failed') {
      stderr = stderr.replace(/^failed to run commands: exit status \d+\n?/m, '');
    }
    return {
      stdout: stdout,
      stderr: stderr,
    };
  }
}
