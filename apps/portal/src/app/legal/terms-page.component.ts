import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LegalPageComponent } from './legal-page.component';
import { operator } from './operator';

@Component({
  selector: 'app-terms-page',
  imports: [LegalPageComponent, RouterLink],
  template: `
    <app-legal-page heading="Terms of service">
      <h2>1. Scope</h2>
      <p>
        These terms apply to the use of App Speed at appspeed.dev, including its API and MCP connector. App Speed is
        provided by {{ operator.name }}, {{ operator.street }}, {{ operator.postcode }} {{ operator.locality }},
        {{ operator.country }} (see the <a routerLink="/legal-notice">legal notice</a>). By using App Speed, you accept
        these terms.
      </p>

      <h2>2. The service</h2>
      <p>
        App Speed is free of charge. It runs automated performance audits of websites, stores their results, and offers
        tools for browser performance traces. There is no entitlement to any particular feature, capacity or
        availability. I may change, limit or discontinue features, and will give reasonable notice before discontinuing
        the service as a whole where possible.
      </p>

      <h2>3. Accounts</h2>
      <p>
        Workspaces require an account, created by signing in with Google or GitHub. Keep access to that account secure.
        You are responsible for what happens in your workspaces, including the members you invite. Workspace admins
        manage access to their workspace's projects.
      </p>

      <h2>4. Submitting websites for audits</h2>
      <p>
        An audit loads the website you submit in an automated browser and performs the steps you define, which creates
        real traffic on that website. You may only audit websites that you operate or are authorised to test. You must
        not use App Speed to:
      </p>
      <ul>
        <li>attack, overload or probe the security of any system, or circumvent its access controls;</li>
        <li>enter other people's credentials or personal data in audit steps;</li>
        <li>process unlawful content or infringe the rights of others;</li>
        <li>interfere with App Speed, circumvent its limits, or access data you are not permitted to see.</li>
      </ul>

      <h2>5. Visibility of audits</h2>
      <p>
        Audits run without signing in are public and visible to anyone in Public View. Audits in a workspace project are
        visible to members with access to that project. See the <a routerLink="/privacy">privacy policy</a> for how
        audit data is handled.
      </p>

      <h2>6. Your content</h2>
      <p>
        You keep all rights to what you submit. You allow me to store, process and display it as needed to provide App
        Speed, including showing public audits to other visitors. I may remove audits or suspend access if they breach
        these terms or the law.
      </p>

      <h2>7. Audit results</h2>
      <p>
        Results are automated lab measurements. They depend on network conditions, device emulation, the state of the
        audited website and the tools used, and can differ between runs and from what real visitors experience. They are
        provided for information only. Check them before relying on them for decisions.
      </p>

      <h2>8. Liability</h2>
      <p>
        App Speed is provided free of charge. I am liable for damage caused intentionally or through gross negligence.
        Liability for slight negligence is excluded, except for personal injury. Liability under mandatory law,
        including the Austrian Product Liability Act, is not affected. I am not responsible for the loss of audit data
        unless I caused it intentionally or through gross negligence. Keep copies of results you need.
      </p>

      <h2>9. Ending use</h2>
      <p>
        You can stop using App Speed at any time and ask for your account to be deleted by emailing
        <a [href]="'mailto:' + operator.email">{{ operator.email }}</a
        >. I may suspend or close accounts that breach these terms.
      </p>

      <h2>10. Changes to these terms</h2>
      <p>
        I will publish changes to these terms on this page with a new date. If you don't agree with a change, you can
        stop using App Speed and have your account deleted.
      </p>

      <h2>11. Governing law and jurisdiction</h2>
      <p>
        These terms are governed by Austrian law, excluding its conflict-of-law rules and the UN Convention on Contracts
        for the International Sale of Goods. If you are a consumer, you keep the protection of the mandatory law of the
        country where you habitually reside. For businesses, the courts with jurisdiction for
        {{ operator.locality }}, Austria, have exclusive jurisdiction. For consumers, the statutory rules on
        jurisdiction apply.
      </p>

      <h2>12. Contact</h2>
      <p>
        Questions about these terms:
        <a [href]="'mailto:' + operator.email">{{ operator.email }}</a
        >.
      </p>
    </app-legal-page>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TermsPageComponent {
  protected readonly operator = operator;
}
