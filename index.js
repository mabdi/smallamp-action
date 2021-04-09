const core = require('@actions/core');
const github = require('@actions/github');

const wait = require('./smallamp');


// most @actions toolkit packages have async methods
async function run() {
  try {
    const testclass = core.getInput('testclass');
    core.info(`Test Amplification started: ${testclass}`);
    await smallamp(testclass);
    core.info(`Test Amplification finished: ${testclass}`);
    core.setOutput('time', 'todo');
  } catch (error) {
    core.setFailed(error.message);
  }
}

run();
