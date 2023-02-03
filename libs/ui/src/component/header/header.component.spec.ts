import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { HeaderComponent } from 'ui';

describe('HeaderComponent', () => {
  let component: HeaderComponent;
  let fixture: ComponentFixture<HeaderComponent>;
  let imgEl: HTMLImageElement;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [HeaderComponent]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(HeaderComponent);
    component = fixture.componentInstance;
    imgEl = fixture.debugElement.query(By.css('.header-navbar-logo')).nativeElement;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should set src attribute on the image', () => {
    fixture.detectChanges();
    expect(imgEl.src).toBe(component.logoSrc);
  });

  it('should set alt attribute on the image', () => {
    fixture.detectChanges();
    expect(imgEl.alt).toBe(component.logoAlt);
  });
});
