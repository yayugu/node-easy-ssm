#! /usr/bin/env node

var EasySSM = require('../easy-ssm');
var easySsm = new EasySSM();
easySsm.run(process.argv[2], process.argv[3], function(err, data) {
  if (err) {
    console.log(err);
    return;
  }
  console.log(JSON.stringify(data, null, 4));
});