import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output, ViewEncapsulation } from '@angular/core';
import { MatToolbar } from '@angular/material/toolbar';
import { MatIconButton } from '@angular/material/button';
import { MatSidenav, MatSidenavContainer, MatSidenavContent } from '@angular/material/sidenav';
import { MatListItem, MatNavList } from '@angular/material/list';
import { MatIcon } from '@angular/material/icon';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'ui-shell',
  templateUrl: './shell.component.html',
  styleUrls: ['./shell.component.scss'],
  standalone: true,
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatSidenavContainer,
    MatSidenav,
    MatSidenavContent,
    MatToolbar,
    MatNavList,
    MatIcon,
    MatIconButton,
    MatListItem,
    RouterLink,
  ],
})
export class ShellComponent {
  readonly sideNavItems = [
    { name: 'Audit Builder', route: 'audit-builder' },
    { name: 'Audit Viewer', route: 'audit-viewer' },
  ];
}
