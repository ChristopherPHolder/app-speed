import { Test, TestingModule } from '@nestjs/testing';
import { ConductorGateway } from './conductor.gateway';

describe('ConductorGateway', () => {
  let gateway: ConductorGateway;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ConductorGateway],
    }).compile();

    gateway = module.get<ConductorGateway>(ConductorGateway);
  });

  it('should be defined', () => {
    expect(gateway).toBeDefined();
  });
});
