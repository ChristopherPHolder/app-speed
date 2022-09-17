require('dotenv').config();
const fs = require('fs');
const AWS = require('aws-sdk');

const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_S3_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_S3_SECRET_ACCESS_KEY,
});

(async () => {

  const urlString = process.argv[2];
  if (!urlString) {
    console.log("No url was provided");
    return;
  }

  const url = new URL(urlString);
  const timestamp = new Date().toISOString().slice(0,16).replace(":", "_")
  const fileKey = `${url.hostname}${timestamp}.uf.html`

  const filePath = './measures/deep-blue-performance-test.uf.html'

  let file; 
  try {
    file = fs.readFileSync(filePath);
  } catch (error) {
    console.log("Error Reading Userflow File\n", error);
    return error;
  };

  const req = await s3.putObject({
    Body: file,
    Bucket: "deepblue-userflow-records",
    Key: fileKey,
    CacheControl: "public, max-age=0, must-revalidate",
    ContentType: "text/html"
  }).promise();

  fs.unlinkSync(filePath);

})();
