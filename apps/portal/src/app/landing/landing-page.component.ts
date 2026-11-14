import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatAnchor } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { LinkCardComponent } from '@app-speed/ui/link-card';
import { PageComponent } from '@app-speed/ui/page';
import { PageHeaderComponent } from '@app-speed/ui/page-header';

@Component({
  selector: 'app-landing-page',
  imports: [MatAnchor, MatIcon, RouterLink, LinkCardComponent, PageComponent, PageHeaderComponent],
  template: `
    <ui-page>
      <ui-page-header
        prominence="hero"
        eyebrow="Web performance toolkit"
        heading="Measure, understand, and improve app speed"
        headingId="landing-title"
        description="Run repeatable user-flow audits, follow results over time, and turn browser traces into useful visuals."
      >
        <div class="hero-actions">
          <a matButton="filled" routerLink="/audits/user-flow">
            Run a user-flow audit
            <mat-icon iconPositionEnd aria-hidden="true">arrow_forward</mat-icon>
          </a>
          <a matButton="outlined" routerLink="/audits/history">View audit history</a>
        </div>
      </ui-page-header>

      <section aria-labelledby="features-title">
        <p class="ui-eyebrow">Get started</p>
        <h2 id="features-title">Choose a workflow</h2>

        <div class="feature-grid">
          <ui-link-card link="/audits/user-flow" icon="speed" heading="Run an audit" action="Create audit">
            Measure a complete user journey with a repeatable sequence of browser steps.
          </ui-link-card>
          <ui-link-card link="/audits/history" icon="history" heading="Review history" action="View history">
            Track scheduled, running, and completed audits from one place.
          </ui-link-card>
          <ui-link-card link="/convenience" icon="construction" heading="Use trace tools" action="Explore tools">
            Extract screenshots and build filmstrips from Chrome traces locally.
          </ui-link-card>
        </div>
      </section>
    </ui-page>
  `,
  styles: `
    .hero-actions {
      display: flex;
      flex-direction: column;
      gap: var(--ui-space-3);
    }
    h2 {
      margin: var(--ui-space-2) 0 var(--ui-space-4);
      font: var(--mat-sys-headline-small);
    }
    .feature-grid {
      display: grid;
      grid-template-columns: minmax(0, 1fr);
      gap: var(--ui-space-4);
    }
    @media (width >= 600px) {
      .hero-actions {
        flex-direction: row;
        flex-wrap: wrap;
      }
      .feature-grid {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
    }
    @media (width >= 840px) {
      .feature-grid {
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: var(--ui-space-6);
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LandingPageComponent {}
