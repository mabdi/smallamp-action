const child_process = require('child_process')
const core = require('@actions/core');
const io = require('@actions/io')
const tc = require('@actions/tool-cache')
const path = require('path')
const os = require('os')
// const style = require('ansi-styles');


const PHARO_ZEROCONF_URL = 'http://get.pharo.org/64/stable'
const PHARO_HOME = path.join(os.homedir(), '.pharo')
const PHARO_VM = 'vm'
const PHARO_IMAGE = 'Pharo.image'

const SMALLAMP_TONEL_DOWNLOAD = 'https://github.com/mabdi/small-amp/archive/master.tar.gz'
const SMALLAMP_HOME = path.join(os.homedir(), '.smallAmp')
const SMALLAMP_RUNNER = path.join(SMALLAMP_HOME, 'runner')
const SMALLAMP_SCRIPTS = path.join(SMALLAMP_HOME, 'scripts')
const SMALLAMP_ZIPS = path.join(SMALLAMP_HOME, '_zip')

const action = core.getInput('action', { required: true });

async function download_Pharo(){
  await logMe('Downloading Pharo')
  const zeroConf = await tc.downloadTool(PHARO_ZEROCONF_URL)
  await logMe('zero conf: '+ zeroConf)
  await io.mv(zeroConf, PHARO_HOME + '/zeroConf')
  await logMe('ls PharoHome: '+ child_process.execSync('ls', {cwd: PHARO_HOME}))
  child_process.execSync('bash zeroConf', {cwd: PHARO_HOME})
  await logMe('ls PharoHome: '+ child_process.execSync('ls', {cwd: PHARO_HOME}))
  let version = await eval_Pharo('Smalltalk version')
  await logMe('Pharo installed: version +', version)
}

async function download_SmallAmp(){
  await logMe('Downloading SmallAmp')
  let tempDir = path.join(os.homedir(), '.smallAmp-temp')
  const tonelPath = await tc.downloadTool(SMALLAMP_TONEL_DOWNLOAD)
  tempDir = await tc.extractTar(tonelPath, tempDir)
  await io.mv(path.join(tempDir, 'small-amp-master'), SMALLAMP_HOME)
  await io.mkdirP(SMALLAMP_ZIPS);
  core.exportVariable('SMALLAMP_HOME', SMALLAMP_HOME);
  core.exportVariable('SMALLAMP_TONEL', SMALLAMP_HOME);
  core.addPath(path.join(SMALLAMP_RUNNER, 'bin'))
  core.exportVariable('SMALLTALK_CI_VM', path.join(PHARO_HOME, PHARO_VM));
  core.exportVariable('SMALLTALK_CI_IMAGE', path.join(PHARO_HOME, PHARO_IMAGE));
  core.exportVariable('SMALLAMP_CI_ZIPS', SMALLAMP_ZIPS);
  
}

async function eval_Pharo(script){
  cmd = PHARO_VM + ' ' + PHARO_IMAGE + ' eval "' + script + '"'
  child_process.execSync(cmd, {cwd: PHARO_HOME})
}

async function eval_st_Pharo(scriptName){
  cmd = PHARO_VM + ' ' + PHARO_IMAGE + ' st "' + scriptName + '"'
  child_process.execSync(cmd, {cwd: PHARO_HOME})
}

async function run_st_script(scriptName){
  await logMe('Running script ', scriptName)
  await io.mv(path.join(SMALLAMP_SCRIPTS, scriptName), PHARO_HOME)
  eval_st_Pharo(scriptName)
}

async function setup_run() {
  await download_Pharo()
  // download_SmallAmp()
  // run_st_script('load_project.st')
  // run_st_script('run_tests.st')
  // run_st_script('load_SmallAmp.st')
}

async function amplify_run() {
  child_process.execSync(cmd, {cwd: PHARO_HOME})
}

async function push_run() {

}

async function logMe(string){
  // const color = style.color.blue
  // core.info(`${color.open}${string}${color.close}`)
  core.info(string)
}

try {
  if(action == 'setup')
    setup_run();
  if(action == 'amplify')
    amplify_run();
  if(action == 'push')
    push_run();
} catch (error) {
  core.setFailed(error.message);
}  