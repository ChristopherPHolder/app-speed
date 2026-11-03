import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { AuthService } from '@app-speed/platform/auth-portal';
@Component({
  selector: 'audit-saved-onboarding',
  imports: [MatButton, MatIcon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './saved-onboarding.component.html',
  styleUrl: './saved-onboarding.component.scss',
})
export class SavedOnboardingComponent {
  protected readonly auth = inject(AuthService);
}
