import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ProgressToasterComponent } from './progress-toaster.component';
import { firstValueFrom, of } from 'rxjs';
import { AUDIT_STATUS, type AuditStatusType } from '@app-speed/shared-utils';

describe('ProgressToasterComponent', () => {
  let component: ProgressToasterComponent;
  let fixture: ComponentFixture<ProgressToasterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProgressToasterComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ProgressToasterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should display the correct text based on progress status', async () => {
    const assertText = async (status: AuditStatusType, expectedText: string) => {
      component.progress = of(status);
      expect(await firstValueFrom(component.toasterText$)).toBe(expectedText);
    };

    await assertText(AUDIT_STATUS.IDLE, '');
    await assertText(AUDIT_STATUS.SCHEDULING, 'Audit is being scheduled');
    await assertText(AUDIT_STATUS.QUEUED, 'The audit has been scheduled');
    await assertText(AUDIT_STATUS.LOADING, 'Downloading results from storage');
    await assertText(AUDIT_STATUS.DONE, '');
    await assertText(AUDIT_STATUS.FAILED, 'Sorry there was an error running the audit');
  });

  // @ TODO - add test to check that error is thrown on incorrect input
  // it('should throw an error if the progress status is not handled', fakeAsync(() => {
  //   const fixture = TestBed.createComponent(ProgressToasterComponent);
  //   const component = fixture.componentInstance;
  //   const progress$ = of('unhandled' as AuditStatusType);
  //   component.progress = progress$;
  //
  //   tick();
  //   expect(() => fixture.detectChanges()).toThrowError(`State unhandled not handled @AuditProgressToasterComponent`);
  // }));
});
