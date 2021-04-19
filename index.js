const core = require('@actions/core');
const io = require('@actions/io')
const tc = require('@actions/tool-cache')
const path = require('path')
const os = require('os')
const github = require('@actions/github');


const SMALLAMP_CI_HOME = path.join(os.homedir(), '.smallAmpCI')
const SMALLAMP_TONEL = path.join(SMALLAMP_CI_HOME, 'tonel')
const SMALLAMP_CI_ZIPS = path.join(SMALLAMP_CI_HOME, '_zip')
const SMALLAMP_DOWNLOAD = 'https://github.com/mabdi/SmallAmp-runner/archive/master.tar.gz'
const SMALLAMP_TONEL_DOWNLOAD = 'https://github.com/mabdi/small-amp/archive/master.tar.gz'

// most @actions toolkit packages have async methods
async function run() {
  try {

     let tempDir = path.join(os.homedir(), '.smallAmpCI-temp')
     const toolPath = await tc.downloadTool(SMALLAMP_DOWNLOAD)
     tempDir = await tc.extractTar(toolPath, tempDir)
     await io.mv(path.join(tempDir, 'SmallAmp-runner-master'), SMALLAMP_CI_HOME)

     const tonelPath = await tc.downloadTool(SMALLAMP_TONEL_DOWNLOAD)
     tempDir = await tc.extractTar(tonelPath, tempDir)
     await io.mv(path.join(tempDir, 'small-amp-master'), SMALLAMP_TONEL)

     await io.mkdirP(SMALLAMP_CI_ZIPS);
     core.exportVariable('SMALLAMP_CI_ZIPS', SMALLAMP_CI_ZIPS);
     core.exportVariable('SMALLAMP_TONEL', SMALLAMP_TONEL);

     core.addPath(path.join(SMALLAMP_CI_HOME, 'bin'))
     core.exportVariable('SMALLAMP_CI_HOME',SMALLAMP_CI_HOME);
     core.exportVariable('SMALLAMP_BRANCH_NAME','SmallAmp-Run' + process.env.GITHUB_RUN_NUMBER);

    
     

  } catch (error) {
    core.setFailed(error.message);
  }
}

run();
