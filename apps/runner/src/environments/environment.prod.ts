export const environment = {
  production: true,
  sqsScheduler: {
    region: 'us-east-1',
    url: 'https://sqs.us-east-1.amazonaws.com/495685399379/ScheduledUserflows.fifo',
  },
  s3ResultsBucket: {
    url: 'https://deepblue-userflow-records.s3.eu-central-1.amazonaws.com/',
    name: 'deepblue-userflow-records',
    region: 'eu-central-1',
  },
};
