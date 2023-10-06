import { Component } from '@angular/core';

@Component({
  selector: 'app-root',
  template: `
    <app-header/>
    <main>
      <router-outlet/>
    </main>
    <footer>Made with &#10084; by <a href='https://twitter.com/chrispholder'>Chris Holder</a></footer>
  `,
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  title = 'App Speed';
}
