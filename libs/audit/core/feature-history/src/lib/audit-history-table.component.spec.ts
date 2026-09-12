import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, beforeEach, expect, it, vi } from 'vitest';
import { AuditRunSummary } from './api/audit-history.models';
import { AuditHistoryTableComponent } from './components/audit-history-table.component';

@Component({
  standalone: true,
  imports: [AuditHistoryTableComponent],
  template: ` <ui-audit-history-table [runs]="runs()" (runSelected)="onRunSelected($event)" /> `,
})
class TestHostComponent {
  runs = signal<AuditRunSummary[]>([
    {
      kind: 'user-flow',
      auditId: 'audit-1',
      title: 'UI Audit',
      status: 'SCHEDULED',
      resultStatus: null,
      queuePosition: 0,
      createdAt: new Date('2026-03-03T10:00:00.000Z').toISOString(),
      startedAt: null,
      completedAt: null,
      durationMs: null,
    },
  ]);

  onRunSelected = vi.fn();
}

describe('AuditHistoryTableComponent', () => {
  let fixture: ComponentFixture<TestHostComponent>;
  let host: TestHostComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestHostComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TestHostComponent);
    host = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('renders readable run metadata and opens the selected audit', () => {
    expect(fixture.nativeElement.textContent).toContain('User flow');
    expect(fixture.nativeElement.textContent).toContain('audit-1');

    const element: HTMLElement = fixture.nativeElement;
    element.querySelector<HTMLButtonElement>('.audit-title')?.click();
    expect(host.onRunSelected).toHaveBeenCalledExactlyOnceWith(host.runs()[0]);
  });
  it('expands run details without navigating, then collapses them', async () => {
    const element: HTMLElement = fixture.nativeElement;
    const toggle = element.querySelector<HTMLButtonElement>('.details-toggle');
    const details = element.querySelector<HTMLTableRowElement>('.detail-row');
    expect(details?.hidden).toBe(true);
    toggle?.click();
    await fixture.whenStable();
    expect(details?.hidden).toBe(false);
    expect(toggle?.getAttribute('aria-expanded')).toBe('true');
    expect(details?.textContent).toContain('Not started');
    expect(host.onRunSelected).not.toHaveBeenCalled();
    toggle?.click();
    await fixture.whenStable();
    expect(details?.hidden).toBe(true);
  });

  it('distinguishes failed results from completed runs and formats duration', async () => {
    host.runs.set([{ ...host.runs()[0], status: 'COMPLETE', resultStatus: 'FAILURE', durationMs: 75778 }]);
    fixture.changeDetectorRef.markForCheck();
    fixture.detectChanges();
    await fixture.whenStable();
    const element: HTMLElement = fixture.nativeElement;
    expect(element.querySelector('.status')?.textContent).toContain('Failed');
    expect(element.querySelector('td.duration')?.textContent).toBe('1m 16s');
    expect(element.querySelector('.queue')).toBeNull();
  });
});
