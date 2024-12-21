import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { ProgressToasterComponent } from './progress-toaster.component';
import { of } from 'rxjs';
import { AUDIT_STATUS } from '@app-speed/shared';

describe('ProgressToasterComponent', () => {
  let component: ProgressToasterComponent;
  let fixture: ComponentFixture<ProgressToasterComponent>;

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

  it('should display the correct text based on progress status', () => {
    component.progress = of(AUDIT_STATUS.IDLE);
    fixture.detectChanges();

    fixture.whenStable().then(() => {
      const compiled = fixture.debugElement.nativeElement;
      expect(compiled.querySelector('.toast-text').textContent).toBe('');
    });

    component.progress = of(AUDIT_STATUS.SCHEDULING);
    fixture.detectChanges();

    fixture.whenStable().then(() => {
      const compiled = fixture.debugElement.nativeElement;
      expect(compiled.querySelector('.toast-text').textContent).toBe('Audit is being scheduled');
    });

    component.progress = of(AUDIT_STATUS.QUEUED);
    fixture.detectChanges();

    fixture.whenStable().then(() => {
      const compiled = fixture.debugElement.nativeElement;
      expect(compiled.querySelector('.toast-text').textContent).toBe('The audit has been scheduled');
    });

    component.progress = of(AUDIT_STATUS.LOADING);
    fixture.detectChanges();

    fixture.whenStable().then(() => {
      const compiled = fixture.debugElement.nativeElement;
      expect(compiled.querySelector('.toast-text').textContent).toBe('Downloading results from storage');
    });

    component.progress = of(AUDIT_STATUS.DONE);
    fixture.detectChanges();

    fixture.whenStable().then(() => {
      const compiled = fixture.debugElement.nativeElement;
      expect(compiled.querySelector('.toast-text').textContent).toBe('');
    });

    component.progress = of(AUDIT_STATUS.FAILED);
    fixture.detectChanges();

    fixture.whenStable().then(() => {
      const compiled = fixture.debugElement.nativeElement;
      expect(compiled.querySelector('.toast-text').textContent).toBe('Sorry there was an error running the audit');
    });
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
