import { Test, TestingModule } from '@nestjs/testing';
import { AuditStoreService } from './audit-store.service';

describe('AuditStoreService', () => {
  let service: AuditStoreService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AuditStoreService],
    }).compile();

    service = module.get<AuditStoreService>(AuditStoreService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
