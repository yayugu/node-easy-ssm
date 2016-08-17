export default class SendCommand {
  constructor(params) {
    this.ssm = params.ssm;
    this.timeoutSec = params.timeoutSec;
    this.maxRetries = params.maxRetries;
    this.logger = params.logger;
  }

  async run(instance_ids, command) {
    if (!Array.isArray(instance_ids)) {
      instance_ids = [instance_ids];
    }
    this.command = command;
    const params = {
      DocumentName: 'AWS-RunShellScript',
      InstanceIds: instance_ids,
      OutputS3BucketName: 'yaguchi-ssm',
      OutputS3KeyPrefix: '',
      Parameters: {commands: [command]},
      TimeoutSeconds: this.timeoutSec,
    };
    const data = await this.sendCommandPromise(params);
    return await this.wait(data.Command.CommandId);
  }

  async wait(commandId) {
    let retries = 0;
    const params = {
      CommandId: commandId,
      Details: true,
    };
    while (true) {
      await this.sleepPromise(3000);
      let data;
      try {
        data = await this.listCommandInvocationsPromise(params);
      } catch (e) {
        if (retries >= this.maxRetries) {
          const error = new Error('call API listCommandInvocations failed ' + retries + ' times: ' + e.toString());
          error.parentError = e;
          error.data = data;
          throw error;
        }
        retries++;
        const random_wait_time = Math.floor(Math.random() * 10 * 1000);
        this.logger.log(e.code, " wait " + random_wait_time + "[ms] and retry");
        await this.sleepPromise(msec);
        continue;
      }
      if (!data || !data.CommandInvocations || !data.CommandInvocations[0] || !data.CommandInvocations[0].Status) {
        const error = new Error('Undefined property: data.CommandInvocations[0].Status');
        error.data = data;
        throw error;
      }
      const status = data.CommandInvocations[0].Status;
      if (status === 'TimedOut' || status === 'Cancelled' || status === 'Failed') {
        const error = new Error('Run Command ' + data.Command.State);
        error.data = data;
        throw error;
      }
      if (status === 'Success') {
        return data;
      }
      retries = 0;
    }
  }

  sendCommandPromise(params) {
    return new Promise((resolve, reject) => {
      this.logger.log('Call SSM:SendCommand');
      this.ssm.sendCommand(params, (err, data) => {
        if (err) {
          reject(err);
        }
        this.logger.log('sendCommand response:');
        this.logger.log(JSON.stringify(data, null, 4));
        resolve(data);
      });
    });
  }

  listCommandInvocationsPromise(params) {
    return new Promise((resolve, _) => {
      this.logger.log('Call SSM:listCommandInvocations');
      this.ssm.listCommandInvocations(params, (err, data) => {
        if (err) {
          reject(err);
        }
        this.logger.log('SSM:ListCommandInvocations response:');
        this.logger.log(JSON.stringify(data, null, 4));
        resolve(data);
      });
    });
  }

  sleepPromise(msec) {
    return new Promise((resolve, _) => {
      setTimeout(resolve, msec);
    });
  }
}