# AppSpeed

The purpose of this repository it to create a simple way to run lighthouse user-flows online in a stable environment. 
It should have a web interface and allow users store and schedule user-flow audits. 

## General architecture for user-flow runner

- APIGateway configured as a websocket
- Lambda function to handle interactions
- SQS Fifo to schedule the audits
- SSM Document to initiate the runner
- EC2 instance to run audits in a stable environment
- S3 bucket to store the results

![Screenshot 2022-11-15 at 15 34 17](https://user-images.githubusercontent.com/40126819/201945750-8067dd5d-04da-49dd-87b3-e331e1a4b580.png)

## The application is deployed using GitHub CI

[Production Url](http://app.deep-blue.io)

[Development URL](http://dev.deep-blue.io.s3-website.eu-central-1.amazonaws.com)

