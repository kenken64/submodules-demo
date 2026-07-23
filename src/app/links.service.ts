import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

export interface Link {
  code: string;
  url: string;
  shortUrl: string;
  hits: number;
  createdAt: string;
}

@Injectable({ providedIn: 'root' })
export class LinksService {
  private readonly http = inject(HttpClient);
  // Same-origin API: the bundled release serves this app and the API from one
  // host. In dev (`ng serve` on :4200), proxy.conf.json forwards /api to the
  // backend on :3000.
  private readonly api = '';

  list(): Observable<Link[]> {
    return this.http.get<Link[]>(this.api + '/api/links');
  }

  create(url: string): Observable<Link> {
    return this.http.post<Link>(this.api + '/api/links', { url });
  }
}
