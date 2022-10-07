const { execSync } = require('node:child_process');

// comand for execution
// node conductor [urlTarget] [env?]

(() => {
  const urlTarget = process.argv[2];
  if (urlTarget) {
    execSync(`npx user-flow --url=${urlTarget} --open=false`);
    execSync(`node s3-uploader ${urlTarget}`);
  }

  const envComand = process.argv[3];
  if (!envComand) {
    console.log('Conductor has stoped script, you probably dont want him to try to turn of your computer ;)');
    return;
  } else if (envComand === 'dev') {
    console.log('Finished running, will not stop instanse but will no longer to anything.')
  }

  // This stops the instance (turns it off)!
  console.log("Okey, no more work. I'm going to sleep not 8*)")
  execSync("sudo shutdown -h now")
})();