import { Component, signal, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LinksService, Link } from './links.service';

@Component({
  selector: 'app-root',
  imports: [FormsModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent {
  private readonly snip = inject(LinksService);

  url = '';
  links = signal<Link[]>([]);
  error = signal<string | null>(null);
  lastShort = signal<string | null>(null);

  constructor() {
    this.refresh();
  }

  refresh(): void {
    this.snip.list().subscribe({
      next: (links) => this.links.set(links),
      error: () => this.error.set('Cannot reach backend'),
    });
  }

  shorten(): void {
    const url = this.url.trim();
    if (!url) return;
    if (!this.isValidHttpUrl(url)) {
      this.error.set('Enter a valid http(s) URL');
      return;
    }
    this.error.set(null);
    this.snip.create(url).subscribe({
      next: (link) => {
        this.lastShort.set(link.shortUrl);
        this.url = '';
        this.refresh();
      },
      error: (e) => this.error.set(e?.error?.error ?? 'Failed to shorten URL'),
    });
  }

  private isValidHttpUrl(value: string): boolean {
    try {
      const u = new URL(value);
      return u.protocol === 'http:' || u.protocol === 'https:';
    } catch {
      return false;
    }
  }
}
