import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AuditStepComponent } from './audit-step.component';

describe('AuditStepComponent', () => {
  let component: AuditStepComponent;
  let fixture: ComponentFixture<AuditStepComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AuditStepComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(AuditStepComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
