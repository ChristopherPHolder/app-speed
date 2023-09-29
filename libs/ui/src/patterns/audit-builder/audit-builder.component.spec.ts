import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AuditBuilderComponent } from './audit-builder.component';

describe('AuditBuilderComponent', () => {
  let component: AuditBuilderComponent;
  let fixture: ComponentFixture<AuditBuilderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AuditBuilderComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(AuditBuilderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
