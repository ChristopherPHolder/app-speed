import { signal, type WritableSignal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { beforeEach, describe, expect, it } from 'vitest';
import { StatusDialog } from './status-dialog';
import type { StatusDialogModel } from './status-dialog.model';

const DEFAULT_VIEW_MODEL: StatusDialogModel = {
  title: 'Loading Status Title',
  subtitle: 'Loading Status Subtitle',
  footerText: 'Loading Status Footer Text',
};

describe('StatusDialog', () => {
  let component: StatusDialog;
  let fixture: ComponentFixture<StatusDialog>;
  let dialogData: WritableSignal<StatusDialogModel>;

  beforeEach(async () => {
    dialogData = signal(DEFAULT_VIEW_MODEL);

    TestBed.configureTestingModule({
      imports: [StatusDialog],
      providers: [
        {
          provide: MAT_DIALOG_DATA,
          useValue: dialogData,
        },
      ],
    });

    fixture = TestBed.createComponent(StatusDialog);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  const getCompiledElement = (): HTMLElement => fixture.debugElement.nativeElement as HTMLElement;

  const setDialogData = (nextValue: StatusDialogModel): void => {
    dialogData.set(nextValue);
    fixture.detectChanges();
  };

  it('creates the component', () => {
    expect(component).toBeTruthy();
  });

  it('renders the provided loading copy', () => {
    const compiled = getCompiledElement();

    expect(compiled.textContent).toContain('Loading Status Title');
    expect(compiled.textContent).toContain('Loading Status Subtitle');
    expect(compiled.textContent).toContain('Loading Status Footer Text');
  });

  it('does not render the subtitle or footer when they are omitted', () => {
    setDialogData({ title: 'Loading Status Title' });

    const compiled = getCompiledElement();

    expect(compiled.textContent).toContain('Loading Status Title');
    expect(compiled.querySelector('mat-card-subtitle')).toBeNull();
    expect(compiled.querySelector('mat-card-footer')).toBeNull();
  });

  it('falls back to the generic loading title when the title is empty', () => {
    setDialogData({ title: '' });

    expect(getCompiledElement().textContent).toContain('loading...');
  });

  it('falls back to the generic loading title when the title is missing', () => {
    setDialogData({});

    expect(getCompiledElement().textContent).toContain('loading...');
  });
});
