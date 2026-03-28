import { ComponentFixture, TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { RadialChartComponent } from './radial-chart.component';

describe('RadialChartComponent', () => {
  let fixture: ComponentFixture<RadialChartComponent>;
  let element: HTMLElement;

  beforeEach(async () => {
    fixture = TestBed.createComponent(RadialChartComponent);
    element = fixture.debugElement.nativeElement;
    await fixture.whenStable();
  });

  it.each([
    { score: 50, expectedClass: 'red' },
    { score: 51, expectedClass: 'orange' },
    { score: 90, expectedClass: 'orange' },
    { score: 91, expectedClass: 'green' },
  ])('applies the $expectedClass threshold for score $score', async ({ score, expectedClass }) => {
    fixture.componentRef.setInput('score', score);
    await fixture.whenStable();

    expect(element.classList.contains(expectedClass)).toBe(true);
  });

  it('defaults to medium and updates the size class when configured', async () => {
    expect(element.classList.contains('md')).toBe(true);

    fixture.componentRef.setInput('size', 'lg');
    await fixture.whenStable();

    expect(element.classList.contains('lg')).toBe(true);
    expect(element.classList.contains('md')).toBe(false);
  });

  it('renders the score text and progress offset', async () => {
    fixture.componentRef.setInput('score', 75);
    await fixture.whenStable();

    const scoreText = element.querySelector('.score-text');
    const progressCircle = element.querySelector('.progress');
    const circumference = 2 * Math.PI * 45;

    expect(scoreText?.textContent?.trim()).toBe('75');
    expect(Number(progressCircle?.getAttribute('stroke-dashoffset'))).toBeCloseTo(circumference * 0.25, 5);
  });
});
