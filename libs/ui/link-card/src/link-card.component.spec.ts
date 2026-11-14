import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { LinkCardComponent } from './link-card.component';

describe('LinkCardComponent', () => {
  it('renders one link to the destination that contains the heading and action', () => {
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    const fixture = TestBed.createComponent(LinkCardComponent);
    fixture.componentRef.setInput('link', '/audits/history');
    fixture.componentRef.setInput('icon', 'history');
    fixture.componentRef.setInput('heading', 'Review history');
    fixture.componentRef.setInput('action', 'View history');
    fixture.detectChanges();

    const links = (fixture.nativeElement as HTMLElement).querySelectorAll('a');
    expect(links).toHaveLength(1);
    expect(links[0].getAttribute('href')).toBe('/audits/history');
    expect(links[0].textContent).toContain('Review history');
    expect(links[0].textContent).toContain('View history');
  });
});
