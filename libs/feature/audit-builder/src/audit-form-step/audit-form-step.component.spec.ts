import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AuditFormStepComponent } from './audit-form-step.component';

describe('AuditFormStepComponent', () => {
  let component: AuditFormStepComponent;
  let fixture: ComponentFixture<AuditFormStepComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AuditFormStepComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(AuditFormStepComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
