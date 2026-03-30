import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { beforeEach, describe, expect, it } from 'vitest';
import { ErrorDialog } from './error-dialog';
import type { ErrorDialogModel } from './error-dialog.model';

const DEFAULT_DIALOG_DATA: ErrorDialogModel = {
  title: 'Request Failed',
  message: 'first line\nsecond line',
};

describe('ErrorDialog', () => {
  let component: ErrorDialog;
  let fixture: ComponentFixture<ErrorDialog>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ErrorDialog],
      providers: [
        {
          provide: MAT_DIALOG_DATA,
          useValue: DEFAULT_DIALOG_DATA,
        },
      ],
    });

    fixture = TestBed.createComponent(ErrorDialog);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('creates the component', () => {
    expect(component).toBeTruthy();
  });

  it('renders the provided error copy', () => {
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.textContent).toContain('Request Failed');
    expect(compiled.textContent).toContain('Failed while validating audit details');
    expect(compiled.textContent).toContain('first line');
    expect(compiled.textContent).toContain('second line');
    expect(compiled.textContent).toContain('Modify');
  });
});
