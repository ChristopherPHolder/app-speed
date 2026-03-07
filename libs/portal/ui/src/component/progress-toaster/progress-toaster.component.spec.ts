import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { ProgressToasterComponent } from './progress-toaster.component';
import { firstValueFrom, of } from 'rxjs';
import { AUDIT_STATUS } from '@app-speed/shared-utils';
describe('ProgressToasterComponent', () => {
  let component: ProgressToasterComponent;
  let fixture: ComponentFixture<ProgressToasterComponent>;

  const assertStatus = async (status: (typeof AUDIT_STATUS)[keyof typeof AUDIT_STATUS], expectedText: string) => {
    component.progress = of(status);
    const text = await firstValueFrom(component.toasterText$);
    expect(text).toBe(expectedText);
  };

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [ProgressToasterComponent],
    }).compileComponents();
  }));
  beforeEach(() => {
    fixture = TestBed.createComponent(ProgressToasterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });
  it('should display the correct text based on progress status', async () => {
    await assertStatus(AUDIT_STATUS.IDLE, '');
    await assertStatus(AUDIT_STATUS.SCHEDULING, 'Audit is being scheduled');
    await assertStatus(AUDIT_STATUS.QUEUED, 'The audit has been scheduled');
    await assertStatus(AUDIT_STATUS.LOADING, 'Downloading results from storage');
    await assertStatus(AUDIT_STATUS.DONE, '');
    await assertStatus(AUDIT_STATUS.FAILED, 'Sorry there was an error running the audit');
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
