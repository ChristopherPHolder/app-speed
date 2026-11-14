import { TestBed } from '@angular/core/testing';
import type Details from 'lighthouse/types/lhr/audit-details';
import { ViewerDetailValueComponent } from './detail-value.component';

const scriptUrl = 'https://connect.facebook.net/en_US/fbevents.js';

const render = (value: Details.ItemValue, parentUrl?: string) => {
  const fixture = TestBed.createComponent(ViewerDetailValueComponent);
  fixture.componentRef.setInput('value', value);
  fixture.componentRef.setInput('parentUrl', parentUrl);
  fixture.detectChanges();
  return fixture.nativeElement.querySelector('.source-location') as HTMLAnchorElement;
};

describe('ViewerDetailValueComponent source locations', () => {
  const location: Details.SourceLocationValue = {
    type: 'source-location',
    url: scriptUrl,
    urlProvider: 'network',
    line: 23,
    column: 6382,
  };

  it('shows the full location on its own', () => {
    const link = render(location);

    expect(link.textContent?.trim()).toBe(`${scriptUrl}:24:6382`);
    expect(link.getAttribute('title')).toBeNull();
  });

  it('drops the URL its parent row already shows, keeping it in the tooltip and link', () => {
    const link = render(location, scriptUrl);

    expect(link.textContent?.trim()).toBe('fbevents.js:24:6382');
    expect(link.getAttribute('title')).toBe(`${scriptUrl}:24:6382`);
    expect(link.getAttribute('href')).toBe(scriptUrl);
  });
});
