export const environment = {
  production: true,
  sqsSchedulerConfig: {
    region: 'us-east-1'
  },
  s3ResultsBucket: {
    url: 'https://deepblue-userflow-records.s3.eu-central-1.amazonaws.com/',
    name: 'deepblue-userflow-records',
  },
};
