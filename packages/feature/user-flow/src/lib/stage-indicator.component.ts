import { Component, inject } from '@angular/core';
import { MatCard, MatCardContent, MatCardHeader, MatCardSubtitle, MatCardTitle } from '@angular/material/card';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { RxIf } from '@rx-angular/template/if';
import { SchedulerService } from '@app-speed/data-access';
import { BehaviorSubject, map, merge } from 'rxjs';

const STAGE = {
  BUILDING: 'building',
  PROCESSING: 'processing',
  SCHEDULING: 'scheduling',
  SCHEDULED: 'scheduled',
  RUNNING: 'running',
  COMPLETE: 'complete',
} as const satisfies Record<string, string>;

const NO_DISPLAY_STAGES = [STAGE.BUILDING, STAGE.COMPLETE] as string[];

type Stage = (typeof STAGE)[keyof typeof STAGE];

@Component({
  standalone: true,
  selector: 'stage-indicator-component',
  imports: [MatCard, MatCardContent, MatCardHeader, MatCardSubtitle, MatCardTitle, MatProgressSpinner, RxIf],
  template: `
    <div class="grid-container" *rxIf="true">
      <mat-card class="loading-card">
        <mat-card-header>
          <mat-card-title> Running Analysis </mat-card-title>
          <mat-card-subtitle> progress</mat-card-subtitle>
        </mat-card-header>
        <mat-card-content [style.padding-top]="'16px'">
          <mat-spinner [diameter]="64" />
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: `
    .grid-container {
      margin: 20px;
    }

    .loading-card {
      align-items: center;
      text-align: center;
    }
  `,
})
export class StageIndicatorComponent {
  readonly #scheduler = inject(SchedulerService);

  readonly #stage = new BehaviorSubject<Stage>(STAGE.BUILDING);

  public readonly stage = merge(this.#stage, this.#scheduler.stage.pipe(map((stage) => stage.stage)));

  readonly display = this.stage.pipe(map((stage) => !NO_DISPLAY_STAGES.includes(stage)));
}
