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
     const artifactName = 'smallAmp-'+ reponame +'-run' + runId;
     const files = fs.readdirSync(dir).filter(fn => fn.endsWith('.zip')).map(x => dir + '/' + x);
     if (files.length > 0)
     {
         const rootDirectory = dir // Also possible to use __dirname
         const options = {
            continueOnError: false
         }
         const uploadResponse = await artifactClient.uploadArtifact(artifactName, files, rootDirectory, options)
     }else{
         core.info('No files to build the artifact. ')
     }
  } catch (error) {
    core.setFailed(error.message);
  }
}

run();
