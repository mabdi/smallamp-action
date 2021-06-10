
const core = require('@actions/core');
const io = require('@actions/io')
const tc = require('@actions/tool-cache')
const exec = require('@actions/exec')
const artifact = require('@actions/artifact')
const github = require('@actions/github');

const child_process = require('child_process')
const path = require('path')
const os = require('os')
const fs = require('fs')
// const style = require('ansi-styles');


/*
I require these ENVs:

loading:
  env:
    project_baseline
    project_directory 
    project_load (optional)

Push:
  input: 
    github-token: ${{secrets.GITHUB_TOKEN}}

*/

const PHARO_HOME = path.join(os.homedir(), '.pharo')
const PHARO_VM = 'pharo'
const PHARO_IMAGE = 'Pharo.image'
const COMMIT_USER = 'mabdi'
const DEFAULT_BRANCH = 'master'
const DEFAULT_SOURCE = 'mabdi/small-amp'

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
  // let version = await run_Pharo("eval 'Smalltalk version'")
  
  core.exportVariable('PHARO_HOME', PHARO_HOME);
  core.exportVariable('PHARO_VM', path.join(PHARO_HOME, PHARO_VM));
  core.exportVariable('PHARO_IMAGE', PHARO_IMAGE);
  // core.exportVariable('SMALLTALK_CI_VM', path.join(PHARO_HOME, PHARO_VM));
  // core.exportVariable('SMALLTALK_CI_IMAGE', path.join(PHARO_HOME, PHARO_IMAGE));
  core.exportVariable('SMALLAMP_ZIPS', SMALLAMP_ZIPS);
  
}

async function download_SmallAmp(){
  let tempDir = path.join(os.homedir(), '.smallAmp-temp')
  const smallampBranch = core.getInput('smallamp-branch') || DEFAULT_BRANCH
  const smallampSource = core.getInput('smallamp-source') || DEFAULT_SOURCE

  const tonelPath = await tc.downloadTool(`https://github.com/${smallampSource}/archive/${smallampBranch}.tar.gz`)
  tempDir = await tc.extractTar(tonelPath, tempDir)
  await io.mv(path.join(tempDir, `small-amp-${smallampBranch}`), SMALLAMP_HOME)
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
  await logMe('Running script '+ scriptName)
  await io.mv(path.join(SMALLAMP_SCRIPTS, scriptName), PHARO_HOME)
  await run_Pharo('st ' + scriptName)
  await io.mv(path.join(PHARO_HOME, scriptName), SMALLAMP_SCRIPTS)
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
  await logMe('PharoHome: \n'+ child_process.execSync('ls -al', {cwd: PHARO_HOME}))
  eval_content = child_process.execSync('cat '+ REPO_NAME + '.stat', {cwd: PHARO_HOME})
  await logMe('Stat eval done:\n' + eval_content)
  if(!eval_content.includes('#allGreen->true')){
    core.warning('All tests are not green. Non-green tests will be ignored.')
  }
}

async function setup_run() {
  try{
    await logMe('***************Downloading SmallAmp')
    await download_SmallAmp()
    await logMe('***************Install Pharo')
    await install_Pharo()
    await logMe('***************Load project')
    await load_project()
  }catch (error) {
    core.setFailed(error.message);
  }  
}

async function build_amplify_artifacts() {
    const dir = SMALLAMP_ZIPS
    const runId = process.env.GITHUB_RUN_NUMBER
    const artifactClient = artifact.create()
    const artifactResults = 'smallAmp-results-'+ REPO_NAME +'-run' + runId;
    const artifactLogs = 'smallAmp-logs-'+ REPO_NAME +'-run' + runId;
    const files_results = fs.readdirSync(dir).filter(fn => fn.endsWith('results.zip')).map(x => dir + '/' + x);
    const files_logs = fs.readdirSync(dir).filter(fn => fn.endsWith('logs.zip')).map(x => dir + '/' + x);
    if (files_results.length > 0)
    {
        const rootDirectory = dir // Also possible to use __dirname
        const options = {
          continueOnError: false
        }
        const uploadResponse = await artifactClient.uploadArtifact(artifactResults, files_results, rootDirectory, options)
    }else{
        core.info('No result files to build the artifact. ')
    }
    if (files_logs.length > 0)
    {
        const rootDirectory = dir // Also possible to use __dirname
        const options = {
          continueOnError: false
        }
        const uploadResponse = await artifactClient.uploadArtifact(artifactLogs, files_logs, rootDirectory, options)
    }else{
        core.info('No logs files to build the artifact. ')
    }
}

async function execute_smallamp_runner() {
  // PHARO_HOME
  // PHARO_IMAGE
  // PHARO_VM

  // iteration": os.getenv('SMALLAMP_iteration'),
  // maxInputs": os.getenv('SMALLAMP_maxInputs'),
  // mode": os.getenv('SMALLAMP_mode'),

  // SMALLAMP_ZIPS

  // await logMe('ls SMALLAMP_RUNNER: \n'+ child_process.execSync('ls -al', {cwd: SMALLAMP_RUNNER}))
  // let myOutput = '';
  // let myError = '';
  // const options = {};
  // options.listeners = {
  //   stdout: (data) => {
  //     myOutput += data.toString();
  //   },
  //   stderr: (data) => {
  //     myError += data.toString();
  //   }
  // };
  // options.cwd = SMALLAMP_RUNNER;
  // await exec.exec('ls -al', options);
  // await exec.exec('python3 runner.py -g', options);
  // await logMe(myOutput)
  // if(myError.length>0){
  //   core.setFailed(myError)
  // }
  await logMe(child_process.execSync('python3 runner.py -g', {cwd: SMALLAMP_RUNNER}))
}

async function amplify_run() {
  try{  
    await logMe('***************Load SmallAmp')
    await load_SmallAmp()
    await logMe('***************Project stat')
    await stat_project()
    await logMe('***************Runner')
    await execute_smallamp_runner()
    await logMe('***************Build artifacts')
    await build_amplify_artifacts()
  }catch (error) {
    core.setFailed(error.message);
  }  
}


async function download_extract_artifact(){
  // const downloadResponse = await artifactClient.downloadAllArtifacts();
  // await logMe('Artifacts dowanloaded:\n' + downloadResponse + '\nls:\n' + child_process.execSync('ls -al', {cwd: PHARO_HOME}))
  // for(const art in downloadResponse){
  //   const cwd = path.join(PHARO_HOME, art['artifactName'])
  //   child_process.execSync("find . -name '*.zip' -exec sh -c 'unzip -d `basename {} .zip` {}; rm {}' ';' ", {cwd: cwd})
  //   child_process.execSync("mv ./* ..", {cwd: cwd})
  // }
  const runId = process.env.GITHUB_RUN_NUMBER
  const artifactClient = artifact.create()
  const artifactResults = 'smallAmp-results-'+ REPO_NAME +'-run' + runId;
  // const downloadResponse = await artifactClient.downloadArtifact(artifactResults, PHARO_HOME, { createArtifactFolder: false })
  const cwd = path.join(PHARO_HOME, artifactResults)
  // await logMe('ls PHARO_HOME:\n' + child_process.execSync('ls -al', {cwd: PHARO_HOME}))
  // await logMe('ls csw:\n' + child_process.execSync('ls -al', {cwd: cwd}))
  const zip_files = fs.readdirSync(cwd).filter(fn => fn.endsWith('.zip'))
  await logMe('zip_files 2:\n' + zip_files)
  for(const index in zip_files){
    const zp = zip_files[index]
    child_process.execSync("yes | unzip " + zp, {cwd: cwd});
    child_process.execSync("rm " + zp, {cwd: cwd});
    // await logMe('ls 2:\n' + child_process.execSync('ls -al', {cwd: cwd}))
  }
  child_process.execSync("mv * ..", {cwd: cwd})
  await logMe('ls PHARO_HOME:\n' + child_process.execSync('ls -al', {cwd: PHARO_HOME}))
}

async function create_overview_artifact(){
  const run_number = process.env.GITHUB_RUN_NUMBER
  child_process.execSync('python3 runner.py -r amp -d '+ PHARO_HOME +' -p '+ REPO_NAME + ' > overview-amp.txt', {cwd: SMALLAMP_RUNNER})
  child_process.execSync('python3 runner.py -r sum -d '+ PHARO_HOME +' -p '+ REPO_NAME + ' > overview-sum.txt', {cwd: SMALLAMP_RUNNER})
  const artifactClient = artifact.create()
  const artifactOverview = 'smallAmp-overview-'+ REPO_NAME +'-run' + run_number;
  const files_overview = fs.readdirSync(SMALLAMP_RUNNER).filter(fn => fn.endsWith('.txt')).map(x => SMALLAMP_RUNNER + '/' + x);
  if (files_overview.length > 0)
  {
      const rootDirectory = SMALLAMP_RUNNER
      const options = {
        continueOnError: false
      }
      const uploadResponse = await artifactClient.uploadArtifact(artifactOverview, files_overview, rootDirectory, options)
  }else{
      core.info('No overview files to build the artifact. ')
  }
}

async function create_commit_from_amplified_classes(){
  const run_number = process.env.GITHUB_RUN_NUMBER
  child_process.execSync("git checkout -b SmallAmp-"+ run_number , {cwd: GITHUB_WORKSPACE})
  await logMe('env:' + child_process.execSync('env', {cwd: PHARO_HOME}))
  await run_st_script('installer.st')
  await logMe('Before commit ls GITHUB_WORKSPACE:\n' + child_process.execSync('ls -al', {cwd: GITHUB_WORKSPACE}))
  child_process.execSync(`git config user.name ${COMMIT_USER}`, {cwd: GITHUB_WORKSPACE})
  child_process.execSync("git add '*.st'", {cwd: GITHUB_WORKSPACE})
  child_process.execSync("git commit -m '[SmallAmp] amplified tests added'", {cwd: GITHUB_WORKSPACE})
  child_process.execSync("git push -u origin HEAD", {cwd: GITHUB_WORKSPACE})
}

async function create_pull_request(){
  const run_number = process.env.GITHUB_RUN_NUMBER
  const base_branch = process.env.GITHUB_REF.substring("refs/heads/".length, process.env.GITHUB_REF.length);
  const myToken = core.getInput('github-token');
  const octokit = github.getOctokit(myToken)
  const res = await octokit.rest.pulls.create({
      owner: COMMIT_USER,
      repo: `${ REPO_NAME }`,
      title: `[SmallAmp] amplified tests for action number ${github.run_number}`,
      head: `SmallAmp-${run_number}`,
      base: base_branch,
      body: "I submit this pull request to suggest new tests based on the output of SmallAmp tool."
  });
  await logMe('Pull request sent: \n' + res)
}

async function push_run() {
  try{
    await logMe('***************Downloading and extracting artifacts')
    await download_extract_artifact();
    await logMe('***************Create overview artifact')
    await create_overview_artifact();
    await logMe('***************Commit all amplified code')
    await create_commit_from_amplified_classes();
    await logMe('***************Send pull request')
    await create_pull_request();
  } catch (error) {
    core.setFailed(error.message);
  }  
}

async function logMe(string){
  // const color = style.color.blue
  // core.info(`${color.open}${string}${color.close}`)
  await core.info(string)
}

if(action == 'setup')
  setup_run();
if(action == 'amplify')
  amplify_run();
if(action == 'push')
  push_run();
