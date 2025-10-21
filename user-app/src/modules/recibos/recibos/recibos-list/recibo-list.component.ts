import { Component, OnDestroy, OnInit } from '@angular/core';
import { RecibosApi, ReciboListItem } from '../recibos.api';
import { Subject, debounceTime, switchMap } from 'rxjs';

@Component({
  selector: 'app-recibos-lista',
  templateUrl: '../recibos-list/recibos-list.component.html',
  styleUrls: ['../recibos-list/recibos-lista.component.scss']
})
export class RecibosListaComponent implements OnInit, OnDestroy {
  q = '';
  page = 1;
  pageSize = 10;

  loading = false;
  items: ReciboListItem[] = [];
  total = 0;

  // Para el template
  Math = Math;

  private search$ = new Subject<void>();
  private alive = true;

  constructor(private api: RecibosApi){}

  ngOnInit(): void {
    this.search$.pipe(
      debounceTime(250),
      switchMap(() => {
        this.loading = true;
        return this.api.list(this.q, this.page, this.pageSize);
      })
    ).subscribe({
      next: (r) => { this.items = r.items; this.total = r.total; this.loading = false; },
      error: () => { this.items = []; this.total = 0; this.loading = false; }
    });

    this.refresh();
  }

  ngOnDestroy(): void { this.alive = false; }

  refresh(){ this.search$.next(); }
  onQuery(s: string){ this.q = s; this.page = 1; this.refresh(); }

  go(p: number){
    if (p < 1) return;
    const max = Math.max(1, Math.ceil(this.total / this.pageSize));
    this.page = Math.min(p, max);
    this.refresh();
  }

  money(n: number | null | undefined){ return 'Q ' + (Number(n||0)).toFixed(2); }

  openPreview(id:number){
    window.open(this.api.previewUrl(id), '_blank');
  }
}
