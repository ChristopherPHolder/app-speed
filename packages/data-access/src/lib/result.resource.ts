import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ResultModel } from './result.model';
import { environment } from 'environments'
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class ResultResource {
  constructor(private http: HttpClient) {
  }

  private readonly baseUrl = environment.s3ResultsBucket.url;

  getResult(resultName: string): Observable<ResultModel> {
    const url = [this.baseUrl, resultName].join('');
    // Optional error handling here
    return this.http.get(url);
  }
}
