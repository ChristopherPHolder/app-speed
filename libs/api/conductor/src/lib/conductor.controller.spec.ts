import { Test, TestingModule } from '@nestjs/testing';
import { ConductorController } from './conductor.controller';

describe('ConductorController', () => {
  let controller: ConductorController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ConductorController],
    }).compile();

    controller = module.get<ConductorController>(ConductorController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
