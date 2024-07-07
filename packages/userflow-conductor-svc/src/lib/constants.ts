export const INSTANCE_IDS = ['i-0781d8307e3c9e9f7'];

export const QUEUE_URL = 'https://sqs.us-east-1.amazonaws.com/495685399379/ScheduledUserflows.fifo';

export const REGION = { region: 'us-east-1' };

export const DOCUMENT_NAME = 'deepblue_userflow_initiator';

export const GROUP_ID = 'scheduled-audit';

export const CONNECTED = 'Websocket connection was successfully open with ufo';
export const DISCONNECTED = 'Websocket connection was successfully closed with ufo';

export const ERROR_01 = 'Error: event body seems to have an issue';
export const ERROR_02 = 'Error: event body is missing the target url';

export const SUCCESS = (target: string) => `Successfully scheduled audit for ${target}`;
