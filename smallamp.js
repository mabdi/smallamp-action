const { exec } = require("child_process");
const core = require('@actions/core');


let smallamp = function () {
  return new Promise((resolve) => {

     exec("ls -la", (error, stdout, stderr) => {
       if (error) {
          core.info(`error: ${error.message}`);
          return;
       }
       if (stderr) {
          core.info(`stderr: ${stderr}`);
          return;
       }
       core.info(`stdout: ${stdout}`);
    });
  });
};

module.exports = smallamp;
