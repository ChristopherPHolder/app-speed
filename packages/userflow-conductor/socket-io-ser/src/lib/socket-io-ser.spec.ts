import { socketIoSer } from './socket-io-ser';

describe('socketIoSer', () => {
  it('should work', () => {
    expect(socketIoSer()).toEqual('socket-io-ser');
  });
});
