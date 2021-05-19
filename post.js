const core = require('@actions/core');
const exec = require('@actions/exec')

const artifact = require('@actions/artifact')
const path = require('path')
const os = require('os')
const fs = require('fs')

async function build_overview() {
    try {
        let base = process.env.SMALLTALK_CI_IMAGE.substring(0,path.lastIndexOf("/")+1);
        const dir = process.env.SMALLAMP_CI_ZIPS
        let myOutput = '';
        let myError = '';
        let detail_amp = '';
        let sum_amp = '';
        const options = {};
        options.listeners = {
          stdout: (data) => {
            myOutput += data.toString();
          },
          stderr: (data) => {
            myError += data.toString();
          }
        };
        options.cwd = process.env.SMALLAMP_CI_HOME;

        await exec.exec('python3', ['runner.py', '-r', 'amp', '-d', base, '-p', process.env.reponame], options);
        detail_amp = myOutput;
        await exec.exec('python3', ['runner.py', '-r', 'sum', '-d', base, '-p', process.env.reponame], options);
        sum_amp = myOutput;

        fs.writeFile(`${dir}/amp.txt`, detail_amp)
        fs.writeFile(`${dir}/sum.txt`, sum_amp)

    } catch (error) {
    core.setFailed(error.message);
  }
}

async function build_artifacts() {
  try {
     const dir = process.env.SMALLAMP_CI_ZIPS
     const runId = process.env.GITHUB_RUN_NUMBER
     const reponame = process.env.reponame

     const artifactClient = artifact.create()

     const artifactResults = 'smallAmp-results-'+ reponame +'-run' + runId;
     const artifactLogs = 'smallAmp-logs-'+ reponame +'-run' + runId;
     const artifactOverview = 'smallAmp-overview-'+ reponame +'-run' + runId;
     const files_results = fs.readdirSync(dir).filter(fn => fn.endsWith('results.zip')).map(x => dir + '/' + x);
     const files_logs = fs.readdirSync(dir).filter(fn => fn.endsWith('logs.zip')).map(x => dir + '/' + x);
     const files_overview = fs.readdirSync(dir).filter(fn => fn.endsWith('logs.txt')).map(x => dir + '/' + x);
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

     if (files_overview.length > 0)
     {
         const rootDirectory = dir // Also possible to use __dirname
         const options = {
            continueOnError: false
         }
         const uploadResponse = await artifactClient.uploadArtifact(artifactOverview, files_overview, rootDirectory, options)
     }else{
         core.info('No overview files to build the artifact. ')
     }
  } catch (error) {
    core.setFailed(error.message);
  }
}

async function run() {
    build_overview();
    build_artifacts();
}

run();