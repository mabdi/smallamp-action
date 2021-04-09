const core = require('@actions/core');

const artifact = require('@actions/artifact')
const path = require('path')
const os = require('os')
const fs = require('fs');



// most @actions toolkit packages have async methods
async function run() {
  try {
     let dir = path.join(os.homedir(), '.smallampCI_zip')
     const artifactClient = artifact.create()
     const artifactName = 'smallAmp-outPut';
     const files = fs.readdirSync(dir).filter(fn => fn.endsWith('.zip'));

     const rootDirectory = dir // Also possible to use __dirname
     const options = {
         continueOnError: false
     }

     const uploadResponse = await artifactClient.uploadArtifact(artifactName, files, rootDirectory, options)

  } catch (error) {
    core.setFailed(error.message);
  }
}

run();
