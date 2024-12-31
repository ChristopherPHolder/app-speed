import { Injectable } from '@nestjs/common';

type AuditDetails = {
  id: string;
  details: any;
};

@Injectable()
export class AuditStoreService {
  audits: AuditDetails[] = [];
}
