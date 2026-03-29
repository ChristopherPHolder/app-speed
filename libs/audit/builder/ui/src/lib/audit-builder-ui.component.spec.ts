import { ComponentFixture, TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { AuditBuilderUiComponent } from './audit-builder-ui.component';

describe('AuditBuilderUiComponent', () => {
  let component: AuditBuilderUiComponent;
  let fixture: ComponentFixture<AuditBuilderUiComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AuditBuilderUiComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(AuditBuilderUiComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('creates the component', () => {
    expect(component).toBeTruthy();
  });

  it('renders the placeholder content', () => {
    const compiled = fixture.debugElement.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('AuditBuilderUi works!');
  });
});
