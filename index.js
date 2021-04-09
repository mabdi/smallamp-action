const smallamp = require('./smallamp');

// most @actions toolkit packages have async methods
async function run() {
  try {
    core.info(`Test Amplification started`);
    await smallamp();
    core.info(`Test Amplification finished`);
  } catch (error) {
    core.setFailed(error.message);
  }
}

run();
