import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppComponent } from './app.component';
import { RouterModule } from '@angular/router';
import { appRoutes } from './app.routes';
import { CoreUiModule } from 'core-ui';
import { FormsModule } from 'forms';

@NgModule({
  declarations: [AppComponent],
  imports: [BrowserModule, RouterModule.forRoot(appRoutes, { initialNavigation: 'enabledBlocking' }), CoreUiModule, FormsModule],
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule {}
