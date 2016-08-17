#! /usr/bin/env node

var EasySSM = require('../easy-ssm');
var easySsm = new EasySSM({logger: process.stdout});
var instance_ids = process.argv[2].split(',');
easySsm.run(instance_ids, process.argv[3], function(err, data) {
  if (err) {
    console.log(err);
    return;
  }
  console.log(JSON.stringify(data, null, 4));
});