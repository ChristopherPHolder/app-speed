type StageChangeResponse = {
  type: 'stage-change';
  stage: string;
  message?: string;
  key?: string;
};
