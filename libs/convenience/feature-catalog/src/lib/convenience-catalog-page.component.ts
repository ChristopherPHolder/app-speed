import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import { LinkCardComponent } from '@app-speed/ui/link-card';
import { PageComponent } from '@app-speed/ui/page';
import { PageHeaderAsideDirective, PageHeaderComponent } from '@app-speed/ui/page-header';

@Component({
  selector: 'lib-convenience-catalog-page',
  imports: [MatIcon, LinkCardComponent, PageComponent, PageHeaderAsideDirective, PageHeaderComponent],
  template: `
    <ui-page>
      <ui-page-header
        prominence="hero"
        eyebrow="Local trace utilities"
        heading="Turn a Chrome trace into useful visuals"
        headingId="catalog-title"
        description="Extract screenshots, build a presentation-ready filmstrip, or compare two visual timelines directly in your browser."
      >
        <p class="privacy-note">
          <mat-icon aria-hidden="true">verified_user</mat-icon>
          Your trace stays on this device. Nothing is uploaded.
        </p>

        <ol uiPageHeaderAside class="workflow" aria-label="How trace tools work">
          <li>
            <mat-icon aria-hidden="true">upload_file</mat-icon>
            <span><strong>Drop a trace</strong><small>.json or .trace</small></span>
          </li>
          <li>
            <mat-icon aria-hidden="true">touch_app</mat-icon>
            <span><strong>Choose a workflow</strong><small>Extract, build, or compare</small></span>
          </li>
          <li>
            <mat-icon aria-hidden="true">download</mat-icon>
            <span><strong>Export locally</strong><small>ZIP or PNG</small></span>
          </li>
        </ol>
      </ui-page-header>

      <section aria-labelledby="tools-title">
        <p class="ui-eyebrow">Trace tools</p>
        <h2 id="tools-title">What do you want to create?</h2>

        <div class="tool-grid">
          <ui-link-card
            link="/convenience/trace/screenshots"
            icon="photo_library"
            overline="Captured frames"
            heading="Extract screenshots"
            action="Open screenshot extractor"
          >
            Preview every captured frame, then download the images and timing metadata in one ZIP.
          </ui-link-card>

          <ui-link-card
            link="/convenience/trace/filmstrip"
            icon="view_carousel"
            overline="Visual timeline"
            heading="Build a filmstrip"
            action="Open filmstrip builder"
          >
            Choose an interval or time range, inspect the frames, and export one horizontal PNG.
          </ui-link-card>

          <ui-link-card
            link="/convenience/trace/filmstrip/compare"
            icon="compare"
            overline="Side-by-side review"
            heading="Compare filmstrips"
            action="Open filmstrip comparison"
          >
            Load two traces, align their visual timelines, and export a clear comparison image.
          </ui-link-card>
        </div>
      </section>
    </ui-page>
  `,
  styles: `
    :host {
      display: block;
    }
    .privacy-note {
      display: flex;
      margin: 0;
      align-items: flex-start;
      gap: var(--ui-space-2);
      color: var(--mat-sys-on-surface-variant);
      font: var(--mat-sys-label-large);
    }
    .privacy-note mat-icon,
    .workflow mat-icon {
      flex: none;
      color: var(--mat-sys-primary);
    }
    .workflow {
      display: grid;
      margin: 0;
      padding: 0;
      list-style: none;
      gap: var(--ui-space-2);
    }
    .workflow li {
      display: flex;
      padding: var(--ui-space-3) var(--ui-space-4);
      border-radius: var(--mat-sys-corner-large);
      background: var(--mat-sys-surface);
      align-items: center;
      gap: var(--ui-space-4);
    }
    .workflow span {
      display: grid;
    }
    .workflow strong {
      font: var(--mat-sys-title-small);
    }
    .workflow small {
      color: var(--mat-sys-on-surface-variant);
      font: var(--mat-sys-body-small);
    }
    h2 {
      margin: var(--ui-space-2) 0 var(--ui-space-4);
      font: var(--mat-sys-headline-small);
    }
    .tool-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(min(280px, 100%), 1fr));
      gap: var(--ui-space-4);
    }
    @media (width >= 840px) {
      .tool-grid {
        gap: var(--ui-space-6);
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConvenienceCatalogPageComponent {}
