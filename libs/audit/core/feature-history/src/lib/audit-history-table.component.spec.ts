import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, beforeEach, expect, it, vi } from 'vitest';
import { AuditHistoryTableComponent } from './components/audit-history-table.component';

@Component({
  standalone: true,
  imports: [AuditHistoryTableComponent],
  template: ` <ui-audit-history-table [runs]="runs" (runSelected)="onRunSelected($event)" /> `,
})
class TestHostComponent {
  runs = [
    {
      auditId: 'audit-1',
      title: 'UI Audit',
      status: 'SCHEDULED' as const,
      resultStatus: null,
      queuePosition: 0,
      createdAt: new Date('2026-03-03T10:00:00.000Z').toISOString(),
      startedAt: null,
      completedAt: null,
      durationMs: null,
    },
  ];

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
    fixture.detectChanges();
  });

  it('renders without HttpClient providers and emits row selection', () => {
    const row = fixture.nativeElement.querySelector('tr.mat-mdc-row') as HTMLTableRowElement;
    row.click();
    expect(host.onRunSelected).toHaveBeenCalledTimes(1);
  });
});
