import { inject, Injectable } from '@angular/core';
import { ApiService } from './api.services';
import { Subject } from 'rxjs';
import { rxEffects } from '@rx-angular/state/effects';
import { eventValue, rxActions } from '@rx-angular/state/actions';
import { AuditDetails } from '@app-speed/shared-user-flow-replay';

@Injectable({ providedIn: 'root' })
export class AuditService {
  private readonly api = inject(ApiService);

  private readonly actions = rxActions<{ submit: AuditDetails }>(({ transforms }) =>
    transforms({ submit: eventValue }),
  );

  constructor() {
    this.actions.onSubmit(
      (auditDetails) => auditDetails,
      (auditDetails) => this.api.requestAudit(auditDetails),
    );
  }

  requestAudit = this.actions.submit;
}
