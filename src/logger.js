export default class Logger {
  constructor(logInterface) {
    this.logInterface = logInterface;
  }

  // compatible with aws-sdk
  // https://github.com/aws/aws-sdk-js/blob/a737d93a82b4d58425fb0e3d749739b952950786/lib/event_listeners.js#L429
  log(message) {
    const messageWithPrefix = '[EasySSM]' + message;
    if (this.logInterface === null || this.logInterface === undefined) {
      return;
    } else if (typeof this.logInterface.log === 'function') {
      this.logInterface.log(messageWithPrefix);
    } else if (typeof this.logInterface.write === 'function') {
      this.logInterface.write(messageWithPrefix + "\n");
    }
  }
}