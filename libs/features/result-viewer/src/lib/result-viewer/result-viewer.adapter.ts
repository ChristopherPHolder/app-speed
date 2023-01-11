import { Injectable } from '@angular/core';
import { RxState } from '@rx-angular/state';
import { ResultResource, ResultModel } from 'data-access';
import { endWith, map, Observable, startWith } from 'rxjs';
// eslint-disable-next-line @nrwl/nx/enforce-module-boundaries
import { AuditStatusType, AUDIT_STATUS } from 'shared';

type AdapterState = {
  reports: ResultModel;
  progress: AuditStatusType;
};

const exampleUrl = 'results-viewer.example.json'

@Injectable({
  providedIn: 'root'
})
export class ResultViewerAdapter extends RxState<AdapterState> {
  readonly results$: Observable<ResultModel> = this.select('reports');
  readonly progress$: Observable<AuditStatusType> = this.select('progress');

  constructor(private resultResource: ResultResource) {
    super();
    // Partial<AdapterState>
    this.connect(
      this.resultResource.getResult(exampleUrl).pipe(
        map(reports => ({reports})),
        startWith({ progress: AUDIT_STATUS.LOADING }),
        endWith({ progress: AUDIT_STATUS.DONE }))
    );
  }
}
