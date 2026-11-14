import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LegalPageComponent } from './legal-page.component';
import { operator } from './operator';

@Component({
  selector: 'app-legal-notice-page',
  imports: [LegalPageComponent, RouterLink],
  template: `
    <app-legal-page heading="Legal notice (Impressum)">
      <p>
        Information pursuant to § 5 of the Austrian E-Commerce Act (ECG) and disclosure pursuant to § 25 of the Austrian
        Media Act (MedienG).
      </p>

      <h2>Service provider and media owner</h2>
      <address>
        {{ operator.name }}<br />
        {{ operator.street }}<br />
        {{ operator.postcode }} {{ operator.locality }}<br />
        {{ operator.country }}
      </address>

      <dl>
        <dt>Email</dt>
        <dd>
          <a [href]="'mailto:' + operator.email">{{ operator.email }}</a>
        </dd>
        <dt>VAT identification number</dt>
        <dd>{{ operator.vatId }}</dd>
        <dt>Business activity</dt>
        <dd>Self-employed IT services, including the development and operation of App Speed</dd>
        <dt>Trade licence</dt>
        <dd>{{ operator.trade }}, granted in Austria</dd>
        <dt>Trade authority</dt>
        <dd>{{ operator.tradeAuthority }}</dd>
        <dt>Chamber membership</dt>
        <dd>{{ operator.chamber }}</dd>
        <dt>Applicable trade regulations</dt>
        <dd>
          Gewerbeordnung 1994 (Austrian Trade Regulation Act), available at
          <a href="https://www.ris.bka.gv.at" target="_blank" rel="noopener noreferrer">www.ris.bka.gv.at</a>
        </dd>
      </dl>

      <h2>Purpose of this website</h2>
      <p>
        App Speed is a web performance toolkit. It runs user-flow audits, keeps their results, and provides tools for
        working with browser performance traces.
      </p>

      <h2>Liability for content and links</h2>
      <p>
        I prepare the content of this website with care, but audit results are automated measurements and I can't
        guarantee that they are complete or accurate. This website links to external websites. Their operators are
        responsible for their content. If I become aware of unlawful content behind a link, I will remove the link.
      </p>

      <p>
        See also the <a routerLink="/privacy">privacy policy</a> and the <a routerLink="/terms">terms of service</a>.
      </p>
    </app-legal-page>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LegalNoticePageComponent {
  protected readonly operator = operator;
}
