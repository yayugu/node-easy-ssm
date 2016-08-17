# Easy SSM
- node.js library and cli command for execute SSM RunCommand.
- Run command and wait and get result easily than using aws-sdk directly.
- Support run on AWS Lambda.

## Using as library

```bash
$ npm install --save easy-ssm
```


```javascript
var EasySSM = require('easy-ssm');
var easySsm = new EasySSM();

easySsm.run(instanceid, command, function(err, output) {
  console.log(output.stdout);
  console.log(output.stderr);
});

// Also support promise.
easySsm.runPromise(instanceId, command).then(...);
```

You can specify some params.

```javascript
var AWS = require('aws-sdk');
var EasySSM = require('easy-ssm');
var params = {
  // S3 Bucket Name
  // Required to get not summarized output longer than 2500.
  OutputS3BucketName: 'my-s3-bucket',
  
  // default: ''
  OutputS3KeyPrefix: 'ssm-outputs',
  
  // Command Execution timeout. default: 60sec
  timeoutSec: 60,  
  
  // aws-sdk objects
  ssm: new AWS.SSM(customParams),
  s3: new AWS.SSM(customParams),
  
  // Allow SSM;ListCommandInvocationError n times. default: 3
  maxRetries: 3,
  
  // A logger object to write debug information to.
  // Set to process.stdout to get logging information about service requests.
  // Object should implement function write(string) or log(string);  
  // default null
  logger: process.stdout,
};
var easySsm = new EasySSM(params);
easySsm.run(instanceid, command, function(err, output) {
  console.log(output.stdout);
  console.log(output.stderr);
});
```

## Using as cli tool

```bash
$ npm install -g easy-ssm
$ easyssm

  Usage: easyssm [options] <instance id> <command...>

  Options:

    -h, --help                    output usage information
    -V, --version                 output the version number
    -b, --bucket <bucket>         S3 bucket name
    -k, --key-prefix <keyPrefix>  S3 key prefix
    -o, --output <format>         specify output format (pretty|raw|json) [pretty]
    --debug                       show debug info
    
$ easyssm i-xxxxxx echo output\; '>&2' echo error
------- stdout -------
output

------- stderr -------
error
```

### Info
- Using multi instances is currently not supported. You can call EasySSM.run() multiply for each instance.
- Currently only Support command 'AWS-RunShellScript'.
- PR welcome!