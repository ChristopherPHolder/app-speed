import { TestBed } from '@angular/core/testing';
import { AvatarComponent } from './avatar.component';

describe('AvatarComponent', () => {
  const create = (inputs: Record<string, unknown>) => {
    const fixture = TestBed.createComponent(AvatarComponent);
    for (const [name, value] of Object.entries(inputs)) fixture.componentRef.setInput(name, value);
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  };

  it('falls back to the first letter of the name, upper-cased', () => {
    const element = create({ name: '  holder' });
    expect(element.textContent?.trim()).toBe('H');
    expect(element.querySelector('img')).toBeNull();
  });

  it('shows the image when there is one', () => {
    const element = create({ name: 'Holder', image: 'logo.png' });
    expect(element.querySelector('img')?.getAttribute('src')).toBe('logo.png');
    expect(element.textContent?.trim()).toBe('');
  });

  it('is hidden from assistive technology', () => {
    expect(create({ name: 'Holder' }).getAttribute('aria-hidden')).toBe('true');
  });
});
