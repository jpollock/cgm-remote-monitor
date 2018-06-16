'use strict';

var engine = require('glooko2nightscout-bridge');

// Track the most recently seen record
var mostRecentRecord;

function init (env) {
  if (env.extendedSettings.glooko && env.extendedSettings.glooko.userName && env.extendedSettings.glooko.password) {
    return create(env);
  } else {
    console.info('Glooko bridge not enabled');
  }
}

function bridged (treatments) {
  function payload (err, treatments_to_store) {
    if (err) {
      console.error('Bridge error: ', err);
    } else {
      treatments_to_store.forEach(function(element) {
        treatments.create(element, function stored (err) {
          if (err) {
          console.error('Bridge storage error: ', err);
          }
        });
      });
    }
  }
  return payload;
}

function options (env) {
  var config = {
    accountName: env.extendedSettings.glooko.userName
    , password: env.extendedSettings.glooko.password
  };

  var fetch_config = {
    maxCount: env.extendedSettings.glooko.maxCount || 1
    , minutes: env.extendedSettings.glooko.minutes || 1440
  };

  return {
    login: config
    , interval: env.extendedSettings.glooko.interval || 60000 * 2.5
    , fetch: fetch_config
    , nightscout: { }
    , maxFailures: env.extendedSettings.glooko.maxFailures || 3
    , firstFetchCount: env.extendedSettings.glooko.firstFetchCount || 3
  };
}

function create (env) {

  var bridge = { };

  var opts = options(env);
  var interval = opts.interval;

  mostRecentRecord = new Date().getTime() - opts.fetch.minutes * 60000

  bridge.startEngine = function startEngine (treatments) {

    opts.callback = bridged(treatments);

    setInterval(function () {
      opts.fetch.minutes = parseInt((new Date() - mostRecentRecord) / 60000);
      opts.fetch.maxCount = parseInt((opts.fetch.minutes / 5) + 1);
      opts.firstFetchCount = opts.fetch.maxCount
      console.log("Fetching Glooko Data: ", 'minutes', opts.fetch.minutes, 'maxCount', opts.fetch.maxCount);
      engine(opts);
    }, interval);
  };

  return bridge;
}

init.create = create;
init.bridged = bridged;
init.options = options;
exports = module.exports = init;
