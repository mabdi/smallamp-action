const child_process = require('child_process')
const core = require('@actions/core');
const io = require('@actions/io')
const tc = require('@actions/tool-cache')
const exec = require('@actions/exec')
const path = require('path')
const os = require('os')
// const style = require('ansi-styles');


/*
I require these ENVs:

loading:
  project_baseline
  project_directory 
  project_load (optional)

*/

const PHARO_HOME = path.join(os.homedir(), '.pharo')
const PHARO_VM = 'pharo'
const PHARO_IMAGE = 'Pharo.image'

const SMALLAMP_DOWNLOAD = 'https://github.com/mabdi/small-amp/archive/master.tar.gz'
const SMALLAMP_HOME = path.join(os.homedir(), '.smallAmp')
const SMALLAMP_RUNNER = path.join(SMALLAMP_HOME, 'runner')
const SMALLAMP_SCRIPTS = path.join(SMALLAMP_HOME, 'scripts')
const SMALLAMP_ZIPS = path.join(SMALLAMP_HOME, '_zip')

const action = core.getInput('action', { required: true });
const REPO_NAME = process.env.reponame

async function install_Pharo(){
  await io.mkdirP(PHARO_HOME);
  await logMe('PHARO_HOME = '+ PHARO_HOME)
  await io.mv(path.join(SMALLAMP_SCRIPTS, 'installPharo.sh'), PHARO_HOME)
  child_process.execSync('./installPharo.sh', {cwd: PHARO_HOME})
  await logMe('After zeroconf ls PharoHome: \n'+ child_process.execSync('ls -al', {cwd: PHARO_HOME}))
  let version = await run_Pharo('eval "Smalltalk version"')
  await logMe('Pharo installed: version +', version)
  // core.exportVariable('SMALLTALK_CI_VM', path.join(PHARO_HOME, PHARO_VM));
  // core.exportVariable('SMALLTALK_CI_IMAGE', path.join(PHARO_HOME, PHARO_IMAGE));
  // core.exportVariable('SMALLAMP_CI_ZIPS', SMALLAMP_ZIPS);
  
}

async function download_SmallAmp(){
  
  let tempDir = path.join(os.homedir(), '.smallAmp-temp')
  const tonelPath = await tc.downloadTool(SMALLAMP_DOWNLOAD)
  tempDir = await tc.extractTar(tonelPath, tempDir)
  await io.mv(path.join(tempDir, 'small-amp-master'), SMALLAMP_HOME)
  await io.mkdirP(SMALLAMP_ZIPS);
  await logMe('ls SMALLAMP_HOME: \n'+ child_process.execSync('ls -al', {cwd: SMALLAMP_HOME}))
  // core.exportVariable('SMALLAMP_HOME', SMALLAMP_HOME);
  core.exportVariable('SMALLAMP_TONEL', SMALLAMP_HOME);
  // core.addPath(path.join(SMALLAMP_RUNNER, 'bin'))
}

async function run_Pharo(arg){
  cmd = './' + PHARO_VM + ' ' + PHARO_IMAGE + ' ' + arg
  child_process.execSync(cmd, {cwd: PHARO_HOME})
}

async function run_st_script(scriptName){
  await logMe('Running script ', scriptName)
  await io.mv(path.join(SMALLAMP_SCRIPTS, scriptName), PHARO_HOME)
  await run_Pharo('st ' + scriptName)
}

async function load_project(){
  // needs 
  // project_baseline should be set
  // project_directory should be set
  // project_load if necessary
  // GITHUB_WORKSPACE
  // reponame
  core.exportVariable('project_repository', process.env.GITHUB_WORKSPACE + '/' + process.env.project_directory);
  await run_st_script('load_project.st')
  await logMe('Project loading done')
}

async function load_SmallAmp(){
  // needs 
  // SMALLAMP_TONEL
  await run_st_script('load_SmallAmp.st')
  await logMe('SmallAmp loading done')
}

async function stat_project(){
  await run_Pharo('smallamp  --save --stat=' + REPO_NAME)
  await logMe('Stat eval done:')
  child_process.execSync('cat '+ REPO_NAME + '.stat', {cwd: PHARO_HOME})
}

async function setup_run() {
  await logMe('***************Downloading SmallAmp')
  await download_SmallAmp()
  await logMe('***************Install Pharo')
  await install_Pharo()
  await logMe('***************Load project')
  await load_project()
  await logMe('***************Load SmallAmp')
  await load_SmallAmp()
  await logMe('***************Project stat')
  await stat_project()
}

async function amplify_run() {
  child_process.execSync(cmd, {cwd: PHARO_HOME})
}

async function push_run() {

}

async function logMe(string){
  // const color = style.color.blue
  // core.info(`${color.open}${string}${color.close}`)
  await core.info(string)
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