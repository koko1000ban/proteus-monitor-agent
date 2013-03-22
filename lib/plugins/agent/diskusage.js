
var domain = require('domain');
var spawn = require('child_process').spawn;

var current;
var ps;
var psconf;
var interval = 5000;

// setup
exports.configure = function(conf) {
  psconf = conf;
  interval = conf.interval || 5000;
  setInterval(check_disk_usage, interval);
};

// init connection
exports.init = function() {
  current = this;
};

// execution domain
var d = domain.create();
d.on('error', function(err) {
  console.error('unexpected error on diskusage plugin');
  console.error(err.stack);
});

function check_disk_usage() {
  d.run(function() {
    var df = spawn('df', ['-h', '/']);
    var dfout = '';
    df.stdout.on('data', function(data) {
      var text = data.toString('utf8');
      dfout += text;
    });
    df.stdout.on('close', function() {
      var result = {};
      var line = dfout.split('\n')[1];

      var regex = new RegExp(/.+([0-9.]+)G\s+([0-9.]+)G\s+([0-9.]+)G\s+([0-9.]+)%.*/);
      var matched = line.match(regex);

      result['size'] = matched[1];
      result['used'] = matched[2];
      result['avail'] = matched[3];
      result['use'] = matched[4];

      // send to the server
      if (current) {
        current.json('diskusage', 'collect', result);
      }
    });
    df.on('error', function(err) {
      console.log("ERROR", err.message);
    });
    df.on('exit', function(code) {
      if (code != 0) {
        console.error('df exit unexpectedly', code);
      }
    });
  });
}

//check_disk_usage();
