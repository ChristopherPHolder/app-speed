import { TestBed } from '@angular/core/testing';
import { MessageComponent } from './message.component';

describe('MessageComponent', () => {
  const create = (inputs: Record<string, unknown> = {}) => {
    const fixture = TestBed.createComponent(MessageComponent);
    for (const [name, value] of Object.entries(inputs)) fixture.componentRef.setInput(name, value);
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  };

  it('announces errors assertively and other tones politely', () => {
    expect(create({ tone: 'error' }).getAttribute('role')).toBe('alert');
    expect(create({ tone: 'warning' }).getAttribute('role')).toBe('status');
    expect(create().getAttribute('role')).toBe('status');
  });

  it('has no live-region role when it should not be announced', () => {
    expect(create({ tone: 'error', announce: false }).hasAttribute('role')).toBe(false);
  });

  it('uses the icon for the tone unless one is given', () => {
    expect(create({ tone: 'warning' }).querySelector('mat-icon')?.textContent).toContain('warning');
    expect(create({ tone: 'warning', icon: 'schedule' }).querySelector('mat-icon')?.textContent).toContain('schedule');
  });

  it('renders the heading only when set', () => {
    expect(create().querySelector('.heading')).toBeNull();
    expect(create({ heading: 'This audit failed' }).querySelector('.heading')?.textContent).toBe('This audit failed');
  });
});
