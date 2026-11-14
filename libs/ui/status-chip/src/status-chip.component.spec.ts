import { TestBed } from '@angular/core/testing';
import { StatusChipComponent } from './status-chip.component';

describe('StatusChipComponent', () => {
  it('reflects the tone on the host and defaults to neutral', () => {
    const fixture = TestBed.createComponent(StatusChipComponent);
    fixture.detectChanges();
    expect(fixture.nativeElement.getAttribute('data-tone')).toBe('neutral');

    fixture.componentRef.setInput('tone', 'error');
    fixture.detectChanges();
    expect(fixture.nativeElement.getAttribute('data-tone')).toBe('error');
  });

  it('shows the icon, and a progress indicator instead when busy', () => {
    const fixture = TestBed.createComponent(StatusChipComponent);
    fixture.componentRef.setInput('icon', 'check');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('mat-icon')?.textContent).toContain('check');
    expect(fixture.nativeElement.querySelector('mat-spinner')).toBeNull();

    fixture.componentRef.setInput('busy', true);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('mat-icon')).toBeNull();
    expect(fixture.nativeElement.querySelector('mat-spinner')).not.toBeNull();
  });
});
