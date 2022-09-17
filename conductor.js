const { execSync } = require('node:child_process');

// comand for execution
// node conductor [urlTarget] [env]

(() => {
  const urlTarget = process.argv[2];
  if (urlTarget) {
    execSync(`npx user-flow --url=${urlTarget} --open=false`);
    execSync(`node s3-uploader ${urlTarget}`);
  }

  const envComand = process.argv[3];
  if (envComand !== 'prod') {
    console.log('Local test completed')
    return;
  }

  // This turns the instance off !
  execSync("shutdown -h now")
})();