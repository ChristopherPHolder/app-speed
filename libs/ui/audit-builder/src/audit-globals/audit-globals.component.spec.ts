import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AuditGlobalsComponent } from './audit-globals.component';

describe('AuditGlobalInputsComponent', () => {
  let component: AuditGlobalsComponent;
  let fixture: ComponentFixture<AuditGlobalsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AuditGlobalsComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(AuditGlobalsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
