export const environment = {
  production: false,
  sqsSchedulerConfig: {
    region: 'us-east-1'
  },
  s3ResultsBucket: {
    url: 'https://deepblue-userflow-records.s3.eu-central-1.amazonaws.com/',
    name: 'deepblue-userflow-records',
  },
  ufoSocketUrl: 'wss://5ag9xf0aab.execute-api.us-east-1.amazonaws.com/ufo',
  isOnlineApi: 'https://deepblue-userflow-records.s3.eu-central-1.amazonaws.com/'
};
