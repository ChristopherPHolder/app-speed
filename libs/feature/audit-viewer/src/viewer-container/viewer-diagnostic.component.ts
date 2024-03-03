import { Component, input } from '@angular/core';
import {
  MatAccordion,
  MatExpansionPanel,
  MatExpansionPanelHeader,
  MatExpansionPanelTitle,
} from '@angular/material/expansion';
import { MatIcon } from '@angular/material/icon';

@Component({
  selector: 'lib-viewer-diagnostic',
  template: `
    <mat-accordion>
      @for (item of diagnosticItems().alert; track item.id) {
        <mat-expansion-panel>
          <mat-expansion-panel-header>
            <mat-panel-title>
              <mat-icon style='color:red; margin-right: 10px;'>warning</mat-icon>
              {{ item.title }}
              @if (item.displayValue) {
                <span style='color: red; margin-left: 5px;'> - {{ item.displayValue }}</span>
              }
            </mat-panel-title>
          </mat-expansion-panel-header>
          <p>{{ item.description }}</p>
        </mat-expansion-panel>
      }
      @for (item of diagnosticItems().warn; track item.id) {
        <mat-expansion-panel>
          <mat-expansion-panel-header>
            <mat-panel-title>
              <mat-icon style='color:orange; margin-right: 10px;'>square</mat-icon>
              {{ item.title }}
              @if (item.displayValue) {
                <span style='color: red; margin-left: 5px;'> - {{ item.displayValue }}</span>
              }
            </mat-panel-title>
          </mat-expansion-panel-header>
          <p>{{ item.description }}</p>
        </mat-expansion-panel>
      }
      @for (item of diagnosticItems().info; track item.id) {
        <mat-expansion-panel>
          <mat-expansion-panel-header>
            <mat-panel-title>
              <mat-icon style='color:gray; margin-right: 10px;'>circle</mat-icon>
              {{ item.title }}
              @if (item.displayValue) {
                <span style='color: red; margin-left: 5px;'> - {{ item.displayValue }}</span>
              }
            </mat-panel-title>
          </mat-expansion-panel-header>
          <p>{{ item.description }}</p>
        </mat-expansion-panel>
      }
    </mat-accordion>
  `,
  standalone: true,
  imports: [
    MatAccordion,
    MatExpansionPanel,
    MatExpansionPanelHeader,
    MatExpansionPanelTitle,
    MatIcon,
  ],
})
export class ViewerDiagnosticComponent {
  diagnosticItems = input.required<{
    alert: any[],
    warn: any[],
    info: any[]
  }>();
}
