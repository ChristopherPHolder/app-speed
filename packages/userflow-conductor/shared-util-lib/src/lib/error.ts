export const extractedError = (error: unknown, extendError = '') => {
  if (error instanceof Error) {
    return extendError + JSON.stringify(error);
  }
  if (typeof error === 'string') {
    return extendError + error;
  }
  return 'Unknown error';
};
