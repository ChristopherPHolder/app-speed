import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { fromFetch } from 'rxjs/fetch';
import { ResultModel } from './result.model';
// eslint-disable-next-line @nrwl/nx/enforce-module-boundaries
import { environment } from 'shared'

@Injectable({
  providedIn: 'root'
})
export class ResultResource {
   private readonly baseUrl = environment.s3ResultsBucket.url;

  getResult(resultName: string): Observable<ResultModel> {
    const url = [this.baseUrl, resultName].join('/');
    return fromFetch(url) as Observable<ResultModel>;
  }
}
