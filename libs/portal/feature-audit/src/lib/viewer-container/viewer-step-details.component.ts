import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { MatTab, MatTabGroup } from '@angular/material/tabs';
import { FlowResult, Result } from 'lighthouse';
import { Result as AuditResult } from 'lighthouse/types/lhr/audit-result';

import { DiagnosticItem, ViewerDiagnosticContext } from '@app-speed/portal-ui/viewer-diagnostics';
import {
  auditClumpId,
  auditBadgeStatus,
  AuditClumpId,
  manualAuditsGroupTitle,
  notApplicableAuditsGroupTitle,
  passedAuditsGroupTitle,
  PerformanceMetricAudit,
  sortAuditRefsByWeight,
  sortFailedPerformanceAudits,
  warningAuditsGroupTitle,
} from '../lighthouse-report-utils';
import { ViewerStepDetailSectionComponent } from './viewer-step-detail-section.component';
import { MetricSummary, ViewerStepMetricSummaryComponent } from './viewer-step-metric-summary.component';
import { ViewerFilmStripComponent } from './viewer-film-strip.component';
import { metricAudits, metricResults } from './view-step-details.adaptor';

type CategoryAuditRef = Result.Category['auditRefs'][number];
type SectionMetadata = NonNullable<FlowResult.Step['lhr']['categoryGroups']>[string];
type DiagnosticAuditRef = CategoryAuditRef & {
  result: AuditResult;
  stackPacks?: { title: string; iconDataURL: string; description: string }[];
};
type DiagnosticSection = {
  key: string;
  title: string;
  description?: string;
  items: DiagnosticItem[];
};
type CategoryView = {
  id: string;
  title: string;
  metricSummary: MetricSummary[];
  sections: DiagnosticSection[];
};

@Component({
  selector: 'viewer-step-detail',
  template: `
    @let categories = categoryViews();

    @if (filmStrip(); as filmStrip) {
      <viewer-film-strip [filmStrip]="filmStrip" />
    }

    @if (categories.length) {
      <mat-tab-group>
        @for (category of categories; track category.id) {
          <mat-tab [label]="category.title">
            @if (category.metricSummary.length) {
              <viewer-step-metric-summary [metricSummary]="category.metricSummary" class="pad" />
            }

            @for (section of category.sections; track section.key) {
              <viewer-step-detail-section
                [title]="section.title"
                [description]="section.description"
                [items]="section.items"
                [context]="diagnosticContext()"
              />
            }
          </mat-tab>
        }
      </mat-tab-group>
    }
  `,
  imports: [
    MatTabGroup,
    MatTab,
    ViewerStepMetricSummaryComponent,
    ViewerFilmStripComponent,
    ViewerStepDetailSectionComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    :host {
      display: block;
      max-width: 1200px;
      margin: auto;
      @media (min-width: 600px) {
        padding: 20px;
      }
    }
    .pad {
      padding: 20px;
    }
  `,
})
export class ViewerStepDetailComponent {
  stepDetails = input.required<FlowResult.Step>();
  private readonly report = computed(() => this.stepDetails().lhr);
  private readonly categoryEntries = computed(() => {
    return Object.entries(this.report().categories) as [string, Result.Category][];
  });

  filmStrip = computed<{ data: string }[] | undefined>(() => {
    const details = this.stepDetails().lhr.audits?.['screenshot-thumbnails']?.['details'];

    if (typeof details !== 'object' || details === null || !('items' in details)) {
      return undefined;
    }

    const items = details.items;
    return Array.isArray(items) ? (items as { data: string }[]) : undefined;
  });

  private readonly performanceMetricAudits = computed<PerformanceMetricAudit[]>(() => {
    const performanceCategory = this.report().categories['performance'];
    if (!performanceCategory) {
      return [];
    }

    return performanceCategory.auditRefs
      .filter((auditRef) => auditRef.group === 'metrics')
      .flatMap((auditRef) => {
        const result = this.report().audits[auditRef.id];
        return result ? [{ ...auditRef, result }] : [];
      });
  });

  readonly categoryViews = computed<CategoryView[]>(() => {
    return this.categoryEntries()
      .map(([categoryId, category]) => {
        const sections = this.buildCategorySections(categoryId, category);
        const metricSummary = this.categoryMetricSummary(categoryId, category);

        return {
          id: categoryId,
          title: category.title,
          metricSummary,
          sections,
        };
      })
      .filter((category) => category.metricSummary.length || category.sections.length);
  });

  private readonly diagnosticItemsMapper = ({ result, weight, stackPacks }: DiagnosticAuditRef): DiagnosticItem => {
    const { id, title, displayValue, description, details, metricSavings } = result;
    return {
      id,
      status: auditBadgeStatus(result),
      title,
      displayValue,
      description,
      details,
      affectedMetrics: Object.keys(metricSavings || {}),
      unscored: weight === 0,
      stackPacks,
    };
  };

  diagnosticContext = computed<ViewerDiagnosticContext>(() => {
    const lhr = this.report();
    return {
      finalDisplayedUrl: lhr.finalDisplayedUrl,
      entities: lhr.entities,
      fullPageScreenshot: lhr.fullPageScreenshot,
    };
  });

  private buildCategorySections(categoryId: string, category: Result.Category): DiagnosticSection[] {
    const audits = this.categoryAudits(categoryId, category);
    if (!audits.length) {
      return [];
    }

    const clumps = new Map<AuditClumpId, DiagnosticAuditRef[]>([
      ['failed', []],
      ['warning', []],
      ['manual', []],
      ['passed', []],
      ['notApplicable', []],
    ]);

    for (const audit of audits) {
      clumps.get(auditClumpId(audit.result))?.push(audit);
    }

    const sections = [
      ...this.buildFailedSections(categoryId, category, clumps.get('failed') ?? []),
      this.buildClumpSection(categoryId, category, 'warning', clumps.get('warning') ?? []),
      this.buildClumpSection(categoryId, category, 'manual', clumps.get('manual') ?? []),
      this.buildClumpSection(categoryId, category, 'passed', clumps.get('passed') ?? []),
      this.buildClumpSection(categoryId, category, 'notApplicable', clumps.get('notApplicable') ?? []),
    ].filter((section): section is DiagnosticSection => Boolean(section));

    if (category.description && !sections.some((section) => section.description)) {
      sections[0] = {
        ...sections[0],
        description: category.description,
      };
    }

    return sections;
  }

  private categoryMetricSummary(categoryId: string, category: Result.Category): MetricSummary[] {
    if (categoryId !== 'performance') {
      return [];
    }

    return metricResults(metricAudits(category.auditRefs), this.report().audits);
  }

  private resolveStackPacks(auditId: string, result: AuditResult): DiagnosticAuditRef['stackPacks'] {
    const stackPacks = this.report().stackPacks ?? [];
    const candidateIds = [auditId, ...(result.replacesAudits ?? [])];
    const matchedPacks = stackPacks.flatMap((pack) => {
      const description = candidateIds.map((id) => pack.descriptions[id]).find((value) => typeof value === 'string');
      return description ? [{ title: pack.title, iconDataURL: pack.iconDataURL, description }] : [];
    });

    return matchedPacks.length ? matchedPacks : undefined;
  }

  private buildFailedSections(
    categoryId: string,
    category: Result.Category,
    audits: DiagnosticAuditRef[],
  ): DiagnosticSection[] {
    if (!audits.length) {
      return [];
    }

    const sortedAudits =
      categoryId === 'performance'
        ? sortFailedPerformanceAudits(audits, this.performanceMetricAudits())
        : sortAuditRefsByWeight(audits);

    const ungroupedAudits: DiagnosticAuditRef[] = [];
    const groupedAudits = new Map<string, DiagnosticAuditRef[]>();

    for (const audit of sortedAudits) {
      if (!audit.group) {
        ungroupedAudits.push(audit);
        continue;
      }

      const group = groupedAudits.get(audit.group) ?? [];
      group.push(audit);
      groupedAudits.set(audit.group, group);
    }

    const sections: DiagnosticSection[] = [];

    if (ungroupedAudits.length) {
      sections.push({
        key: `${categoryId}:failed`,
        title: this.sectionTitle(categoryId, category.title),
        description: category.description,
        items: ungroupedAudits.map(this.diagnosticItemsMapper),
      });
    }

    for (const [groupId, groupAudits] of groupedAudits) {
      const metadata = this.sectionMetadata(groupId);
      sections.push({
        key: `${categoryId}:failed:${groupId}`,
        title: this.sectionTitle(categoryId, category.title, metadata?.title),
        description: metadata?.description,
        items: groupAudits.map(this.diagnosticItemsMapper),
      });
    }

    return sections;
  }

  private buildClumpSection(
    categoryId: string,
    category: Result.Category,
    clumpId: Exclude<AuditClumpId, 'failed'>,
    audits: DiagnosticAuditRef[],
  ): DiagnosticSection | undefined {
    if (!audits.length) {
      return undefined;
    }

    return {
      key: `${categoryId}:${clumpId}`,
      title: this.sectionTitle(categoryId, category.title, this.clumpTitle(clumpId)),
      description: clumpId === 'manual' ? category.manualDescription : undefined,
      items: sortAuditRefsByWeight(audits).map(this.diagnosticItemsMapper),
    };
  }

  private categoryAudits(categoryId: string, category: Result.Category): DiagnosticAuditRef[] {
    return category.auditRefs.flatMap((auditRef) => {
      const group =
        categoryId === 'performance' && auditRef.group === 'hidden' && auditRef.id.endsWith('-insight')
          ? 'insights'
          : auditRef.group;

      if (group === 'hidden' || (categoryId === 'performance' && group === 'metrics')) {
        return [];
      }

      const result = this.report().audits[auditRef.id];
      if (!result) {
        return [];
      }

      return [
        {
          ...auditRef,
          group,
          result,
          stackPacks: this.resolveStackPacks(auditRef.id, result),
        },
      ];
    });
  }

  private sectionMetadata(key: string): SectionMetadata | undefined {
    return this.report().categoryGroups?.[key];
  }

  private clumpTitle(clumpId: Exclude<AuditClumpId, 'failed'>): string {
    switch (clumpId) {
      case 'warning':
        return warningAuditsGroupTitle(this.report());
      case 'manual':
        return manualAuditsGroupTitle(this.report());
      case 'notApplicable':
        return notApplicableAuditsGroupTitle(this.report());
      case 'passed':
      default:
        return passedAuditsGroupTitle(this.report());
    }
  }

  private sectionTitle(categoryId: string, categoryTitle: string, sectionTitle?: string): string {
    if (!sectionTitle || sectionTitle === categoryTitle) {
      return categoryTitle;
    }

    return categoryId === 'performance' ? sectionTitle : `${categoryTitle}: ${sectionTitle}`;
  }
}
