const core = require('@actions/core');
const io = require('@actions/io')
const tc = require('@actions/tool-cache')
const path = require('path')
const os = require('os')


const SMALLAMP_CI_HOME = path.join(os.homedir(), '.smallAmpCI')
const SMALLAMP_CI_ZIPS = path.join(SMALLAMP_CI_HOME, '_zip')
const SMALLAMP_DOWNLOAD = 'https://github.com/mabdi/SmallAmp-runner/archive/master.tar.gz'

// most @actions toolkit packages have async methods
async function run() {
  try {

     let tempDir = path.join(os.homedir(), '.smallAmpCI-temp')
     const toolPath = await tc.downloadTool(SMALLAMP_DOWNLOAD)
     tempDir = await tc.extractTar(toolPath, tempDir)
     await io.mv(path.join(tempDir, 'SmallAmp-runner-master'), SMALLAMP_CI_HOME)
     await io.mkdirP(SMALLAMP_CI_ZIPS);
     core.exportVariable('SMALLAMP_CI_ZIPS', SMALLAMP_CI_ZIPS);

     core.addPath(path.join(SMALLAMP_CI_HOME, 'bin'))
     core.exportVariable('SMALLAMP_CI_HOME',SMALLAMP_CI_HOME);
  } catch (error) {
    core.setFailed(error.message);
  }
}

run();
