import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  OnInit,
  signal,
  viewChild,
} from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { AuditBuilderComponent } from '@app-speed/portal-ui/audit-builder';
import { ActivatedRoute, Router } from '@angular/router';
import { BehaviorSubject, distinctUntilChanged, filter, of, startWith, switchMap, tap } from 'rxjs';
import { AuditDetails, DEFAULT_AUDIT_DETAILS } from '@app-speed/shared-user-flow-replay';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ApiService } from '@app-speed/portal-data-access';
import { RxPush } from '@rx-angular/template/push';

@Component({
  // TODO rename to builder-container
  selector: 'builder-form',
  template: `
    <ui-audit-builder [initialAudit]="initialAudit" (submitAudit)="this.handleSubmit($event)" [modifying]="true" />
    @let requestStatus = requestStatus$ | push;
    @if (requestStatus) {
      {{ requestStatus }}
    }
  `,
  styleUrl: './audit-builder.styles.scss',
  imports: [ReactiveFormsModule, AuditBuilderComponent, RxPush],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
// eslint-disable-next-line @angular-eslint/component-class-suffix
export class AuditBuilderContainer implements OnInit {
  auditForm = viewChild.required(AuditBuilderComponent);
  private modifying = signal(true); // TODO remove this
  private readonly submitting$ = new BehaviorSubject<boolean>(false);

  private api = inject(ApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  readonly requestStatus$ = this.submitting$.pipe(
    distinctUntilChanged(),
    switchMap((inProgress) => {
      if (!inProgress) {
        return of(null);
      }
      return this.api.requestAudit(this.auditForm().formGroup.value).pipe(
        tap((response) => {
          console.log('Scheduled audit', response);
        }),
        startWith({ status: 'requesting' }),
      );
    }),
  );

  // TODO fix typing
  handleSubmit(auditDetails: any): void {
    this.submitting$.next(true);
    this.modifying.set(true);
    this.auditForm().formGroup.disable();
    this.auditForm().accordion().closeAll();
    // Should run post request to request audit from API
    // Should set progress indicator until success or error
    // onError should display error message on toaster and on toaster close readable to form
    // onSuccess should navigate to viewer
    // Progress
    console.log(auditDetails);
  }

  constructor() {
    const destroyRef = inject(DestroyRef);
    afterNextRender(() => {
      this.auditForm()
        .formGroup.valueChanges.pipe(
          filter(() => this.modifying()),
          tap((auditDetails) => {
            return this.router.navigate([], {
              relativeTo: this.route,
              queryParams: { ['audit-details']: JSON.stringify(auditDetails) },
              queryParamsHandling: 'replace',
            });
          }),
          takeUntilDestroyed(destroyRef),
        )
        .subscribe();
    });
  }
  initialAudit!: AuditDetails;
  ngOnInit() {
    // TODO move logic to router
    this.initialAudit = this.getInitialAuditDetails();
  }

  private getInitialAuditDetails(): AuditDetails {
    const auditDetailsQuery = this.route.snapshot.queryParams['audit-details'];
    if (auditDetailsQuery) {
      try {
        return JSON.parse(auditDetailsQuery);
      } catch (e) {
        console.error('AuditDetailsQuery', e);
        return DEFAULT_AUDIT_DETAILS;
      }
    }
    return DEFAULT_AUDIT_DETAILS;
  }
}
