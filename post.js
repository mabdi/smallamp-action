const core = require('@actions/core');

const artifact = require('@actions/artifact')
const path = require('path')
const os = require('os')
const fs = require('fs');



// most @actions toolkit packages have async methods
async function run() {
  try {
     const dir = process.env.SMALLAMP_CI_ZIPS
     const runId = process.env.GITHUB_RUN_NUMBER
     const reponame = process.env.reponame

     const artifactClient = artifact.create()

     const artifactResults = 'smallAmp-results-'+ reponame +'-run' + runId;
     const artifactLogs = 'smallAmp-logs-'+ reponame +'-run' + runId;
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

  } catch (error) {
    core.setFailed(error.message);
  }
}

run();
