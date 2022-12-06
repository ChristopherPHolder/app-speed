import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AuditFormComponent } from './audit-form.component';

describe('AuditFormComponent', () => {
  let component: AuditFormComponent;
  let fixture: ComponentFixture<AuditFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [AuditFormComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(AuditFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
