// Single-entry installer wrapper: delegates to setup-single.js for a unified install flow
const setup = require('./setup-single');
const arg = process.argv[2];
(async () => {
  if (arg === 'init' || arg === 'migrate') {
    await setup(arg);
  } else {
    console.log('Uso: node installer/index.js init|migrate');
  }
})();
