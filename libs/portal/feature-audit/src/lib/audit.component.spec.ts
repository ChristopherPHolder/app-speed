import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach } from 'vitest';
import { AuditComponent } from './audit.component';

describe('AuditComponent', () => {
  let component: AuditComponent;
  let fixture: ComponentFixture<AuditComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AuditComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(AuditComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have the correct title', () => {
    expect(component.title).toBe('Audit Component');
  });

  it('should display the audit feature heading', () => {
    const compiled = fixture.debugElement.nativeElement;
    const heading = compiled.querySelector('h2');
    expect(heading.textContent).toBe('Audit Feature');
  });

  it('should display the welcome message', () => {
    const compiled = fixture.debugElement.nativeElement;
    const paragraph = compiled.querySelector('p');
    expect(paragraph.textContent).toBe('Welcome to the audit feature!');
  });

  it('should have the correct container class', () => {
    const compiled = fixture.debugElement.nativeElement;
    const container = compiled.querySelector('.audit-container');
    expect(container).toBeTruthy();
  });

  it('should render the component with the correct structure', () => {
    const compiled = fixture.debugElement.nativeElement;
    expect(compiled.querySelector('.audit-container')).toBeTruthy();
    expect(compiled.querySelector('h2')).toBeTruthy();
    expect(compiled.querySelector('p')).toBeTruthy();
  });
});
