export const environment = {
  production: false,
  sqsSchedulerConfig: {
    region: 'us-east-1',
  },
  s3ResultsBucket: {
    url: 'https://deepblue-userflow-records.s3.eu-central-1.amazonaws.com/',
    name: 'deepblue-userflow-records',
  },
  ufoSocketUrl: 'wss://2of68hlyc3.execute-api.us-east-1.amazonaws.com/prod/',
  isOnlineApi: 'https://ib3ncok6l1.execute-api.us-east-1.amazonaws.com/Prod/is-online',
};
