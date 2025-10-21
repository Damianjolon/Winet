import { Component, ElementRef, EventEmitter, Input, OnChanges, Output, ViewChild } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-recibo-preview-modal',
  templateUrl: './preview-modal.component.html',
  styleUrls: ['./preview-modal.component.scss']
})
export class ReciboPreviewModalComponent implements OnChanges {
  @Input() visible = false;
  @Input() url: string | null = null;
  @Output() closed = new EventEmitter<void>();

  @ViewChild('frame', { static: false }) frame: ElementRef<HTMLIFrameElement> | undefined;

  safeUrl: SafeResourceUrl | null = null;

  constructor(private sn: DomSanitizer){}

  ngOnChanges(): void {
    // cache-bust para recargar siempre la última versión
    this.safeUrl = this.url ? this.sn.bypassSecurityTrustResourceUrl(`${this.url}?_=${Date.now()}`) : null;
  }

  onIframeLoad(target: EventTarget | null){
    const iframe = target as HTMLIFrameElement;
    if (!iframe) return;
    try {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print?.(); // auto imprimir al cargar
    } catch {}
  }

  print(iframe: HTMLIFrameElement){
    try { iframe.contentWindow?.print?.(); } catch {}
  }
  close(){ this.closed.emit(); }
}
