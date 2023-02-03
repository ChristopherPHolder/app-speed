import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProgressToasterComponent } from './progress-toaster.component';

describe('ProgressToasterComponent', () => {
  let component: ProgressToasterComponent;
  let fixture: ComponentFixture<ProgressToasterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProgressToasterComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ProgressToasterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
