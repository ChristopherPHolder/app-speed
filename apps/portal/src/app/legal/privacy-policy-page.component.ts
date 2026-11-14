import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { AnalyticsConsentService } from '../analytics/analytics-consent.service';
import { LegalPageComponent } from './legal-page.component';
import { operator } from './operator';

@Component({
  selector: 'app-privacy-policy-page',
  imports: [LegalPageComponent, MatButton],
  template: `
    <app-legal-page heading="Privacy policy">
      <p>
        This policy explains which personal data App Speed processes, why, and what rights you have under the General
        Data Protection Regulation (GDPR) and Austrian law.
      </p>

      <h2 id="controller">Who is responsible</h2>
      <address>
        {{ operator.name }}<br />
        {{ operator.street }}, {{ operator.postcode }} {{ operator.locality }}, {{ operator.country }}<br />
        <a [href]="'mailto:' + operator.email">{{ operator.email }}</a>
      </address>
      <p>Send privacy questions and requests to this address. I don't have a data protection officer.</p>

      <h2 id="visiting">Visiting the website</h2>
      <p>
        When you open App Speed, your browser sends technical data that is needed to deliver the pages: your IP address,
        the date and time, the page requested, and your browser and operating system. The servers process this data to
        deliver the website and the API, and may log it to keep the service secure and fix errors. Logs are kept only as
        long as needed for those purposes.
      </p>
      <p>
        Legal basis: my legitimate interest in providing a secure, working website (Art. 6(1)(f) GDPR). Fonts and icons
        are served from App Speed's own servers, so loading a page doesn't contact Google or other font providers.
      </p>

      <h2 id="audits">Running audits</h2>
      <p>
        When you run an audit, App Speed stores what you submit: the URL, the user-flow steps, any values you enter in
        those steps, and the device settings. A browser in the AWS data centre in Frankfurt then loads that website, and
        App Speed stores the results, including Lighthouse reports and screenshots of the audited pages.
      </p>
      <ul>
        <li>
          <strong>Audits you run without signing in are public.</strong> They appear in Public View and audit history,
          where anyone can see them.
        </li>
        <li>Audits you run in a workspace project are visible only to members with access to that project.</li>
        <li>
          Don't enter passwords, personal data or other secrets in audit steps, and only audit pages that don't show
          personal data. Screenshots record whatever the page displays.
        </li>
      </ul>
      <p>
        Legal basis: providing the service you requested (Art. 6(1)(b) GDPR). For audits run without an account, my
        legitimate interest in offering a free public tool (Art. 6(1)(f) GDPR).
      </p>

      <h2 id="trace-tools">Trace tools</h2>
      <p>The trace tools process the trace file in your browser. The file is not uploaded to App Speed.</p>

      <h2 id="accounts">Accounts and workspaces</h2>
      <p>
        You can sign in with Google or GitHub. Sign-in is handled by Clerk. The provider you choose shares your name,
        email address, username and profile picture with Clerk, and Clerk keeps your account and session. App Speed
        stores your account identifier, email address, and the workspaces, projects, memberships, invitations and
        workspace logos that you and other members create. An invitation contains the invitee's email address and
        expires after seven days. App Speed does not send invitation emails.
      </p>
      <p>Legal basis: providing the account and workspace features you signed up for (Art. 6(1)(b) GDPR).</p>
      <p>
        If you connect App Speed to an AI assistant such as Claude or ChatGPT through the MCP connector, that assistant
        acts with your permissions and receives the audit data it requests. Its provider processes that data under your
        agreement with them.
      </p>

      <h2 id="analytics">Google Analytics</h2>
      <p>
        With your consent, App Speed uses Google Analytics 4 to understand how the website is used. Analytics stays off
        until you accept it in the cookie banner. When it is on, Google receives the pages you view, with audit IDs,
        query strings and fragments removed, along with device and browser information and your IP address, which Google
        uses to derive an approximate location. Google signals and advertising personalisation are off.
      </p>
      <p>
        Provider: Google Ireland Limited, Gordon House, Barrow Street, Dublin 4, Ireland. Data can also be transferred
        to Google LLC in the USA. Legal basis: your consent (Art. 6(1)(a) GDPR and § 165(3) of the Austrian
        Telecommunications Act 2021). You can withdraw consent at any time. Withdrawing doesn't affect processing that
        took place before. Withdrawing removes the analytics cookies and reloads the page.
        <a href="https://policies.google.com/technologies/partner-sites" target="_blank" rel="noopener noreferrer"
          >How Google uses information from sites that use its services</a
        >.
      </p>
      <p>
        <button matButton="outlined" type="button" (click)="consent.settingsOpen.set(true)">
          Change cookie settings
        </button>
      </p>

      <h2 id="cookies">Cookies and browser storage</h2>
      <div class="table-scroll">
        <table aria-labelledby="cookies">
          <thead>
            <tr>
              <th scope="col">Name</th>
              <th scope="col">Purpose</th>
              <th scope="col">Lifetime</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><code>app-speed.analytics-consent.v1</code> (local storage)</td>
              <td>Remembers your analytics choice. Necessary.</td>
              <td>180 days</td>
            </tr>
            <tr>
              <td><code>app-speed.context.*</code> (local storage)</td>
              <td>Remembers the workspace and project you last opened. Necessary, signed-in users only.</td>
              <td>Until you clear it</td>
            </tr>
            <tr>
              <td><code>__session</code>, <code>__client_uat</code>, <code>__client</code> and variants (Clerk)</td>
              <td>Keep you signed in. Necessary, only when you use sign-in.</td>
              <td>Set by Clerk; ended when you sign out</td>
            </tr>
            <tr>
              <td><code>_ga</code>, <code>_ga_W51NXLKGXB</code> (Google Analytics)</td>
              <td>Distinguish visits for analytics. Only with your consent.</td>
              <td>180 days</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p>
        Necessary storage is permitted without consent under § 165(3) of the Austrian Telecommunications Act 2021,
        because the features you use don't work without it.
      </p>

      <h2 id="recipients">Service providers</h2>
      <p>These providers process data on my behalf or, where noted, as independent controllers:</p>
      <ul>
        <li>
          <strong>Amazon Web Services EMEA SARL</strong> (Luxembourg): hosting of the website, API and audit browsers,
          and storage of audit results, in Frankfurt, Germany.
        </li>
        <li><strong>Supabase, Inc.</strong> (USA): database hosting, in the EU (Ireland).</li>
        <li><strong>Clerk, Inc.</strong> (USA): sign-in and account management.</li>
        <li><strong>Google Ireland Limited</strong> (Ireland): Google Analytics, only with your consent.</li>
        <li>
          <strong>Google and GitHub, Inc.</strong> (USA): only if you sign in with them. They are independent
          controllers for your account with them.
        </li>
      </ul>

      <h2 id="transfers">Transfers outside the EU</h2>
      <p>
        Some providers are based in the USA or may access data from there. Transfers rely on the EU–US Data Privacy
        Framework where the recipient is certified under it, and otherwise on the European Commission's Standard
        Contractual Clauses (Art. 46(2)(c) GDPR).
      </p>

      <h2 id="retention">How long data is kept</h2>
      <ul>
        <li>Account data: until you delete your account or ask me to delete it.</li>
        <li>
          Workspaces, projects and memberships: until they are deleted. Audits stay in place when their project or
          workspace is deleted, so that history isn't lost or made public.
        </li>
        <li>Audits and results: until you ask me to delete them.</li>
        <li>Analytics choice: 180 days, then the banner asks again.</li>
        <li>Google Analytics data: up to 14 months at Google.</li>
        <li>Emails you send me: as long as needed to answer them and for any related legal claims.</li>
      </ul>

      <h2 id="rights">Your rights</h2>
      <p>
        You have the right to access your data, to have it corrected or deleted, to restrict its processing, to data
        portability, and to object to processing based on legitimate interests (Art. 15–21 GDPR). Where processing is
        based on consent, you can withdraw it at any time. To use these rights, email
        <a [href]="'mailto:' + operator.email">{{ operator.email }}</a
        >.
      </p>
      <p>
        You can also complain to a supervisory authority. In Austria this is the Datenschutzbehörde, Barichgasse 40–42,
        1030 Vienna,
        <a href="https://www.dsb.gv.at" target="_blank" rel="noopener noreferrer">www.dsb.gv.at</a>.
      </p>

      <h2 id="other">Other information</h2>
      <p>
        You don't have to provide personal data to browse App Speed or use the trace tools. An account is required only
        for workspaces. App Speed makes no automated decisions about you within the meaning of Art. 22 GDPR. I will
        update this policy when the service changes and show the date of the change at the top.
      </p>
    </app-legal-page>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PrivacyPolicyPageComponent {
  protected readonly operator = operator;
  protected readonly consent = inject(AnalyticsConsentService);
}
