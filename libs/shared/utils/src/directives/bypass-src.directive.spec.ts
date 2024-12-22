import { BypassSrcDirective } from './bypass-src.directive';
import { Component } from '@angular/core';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { By } from '@angular/platform-browser';

@Component({
  template: '<iframe bypassSrc=""></iframe>',
  imports: [BypassSrcDirective],
})
class TestComponent {}

describe('BypassSrcDirective', () => {
  let fixture: ComponentFixture<TestComponent>;
  let iframe: HTMLIFrameElement;
  let input: string;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({ imports: [TestComponent] });
    fixture = TestBed.createComponent(TestComponent);
    iframe = fixture.debugElement.query(By.directive(BypassSrcDirective)).nativeElement;
  }));

  it('should set src attribute on the iframe', () => {
    expect(iframe.src).toBe('http://localhost/');
  });

  it('should reset if the input binding changes', () => {
    input = 'newInputBinding';
    iframe.src = input;
    fixture.detectChanges();
    expect(iframe.src).toBe('http://localhost/newInputBinding');
  });

  it('should reset to a complete url if one is given', () => {
    input = 'https://www.example.com/';
    iframe.src = input;
    fixture.detectChanges();
    expect(iframe.src).toBe('https://www.example.com/');
  });

  it('should combine the input with the current domain if it does not include the http protocol', () => {
    input = 'example.com';
    iframe.src = input;
    fixture.detectChanges();
    expect(iframe.src).toBe('http://localhost/example.com');

    input = 'www.example.com';
    iframe.src = input;
    fixture.detectChanges();
    expect(iframe.src).toBe('http://localhost/www.example.com');

    input = 'http www.example.com';
    iframe.src = input;
    fixture.detectChanges();
    expect(iframe.src).toBe('http://localhost/http%20www.example.com');
  });
});
