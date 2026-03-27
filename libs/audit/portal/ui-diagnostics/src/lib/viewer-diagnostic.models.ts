import type Details from 'lighthouse/types/lhr/audit-details';
import type Result from 'lighthouse/types/lhr/lhr';
import type { StatusOptions } from '@app-speed/portal-ui/status-badge';

export type ViewerDiagnosticContext = {
  finalDisplayedUrl?: string;
  entities?: Result.Entities | null;
  fullPageScreenshot?: Result.FullPageScreenshot | null;
};

export type DiagnosticStackPack = {
  title: string;
  iconDataURL: string;
  description: string;
};

export type DiagnosticItem = {
  id: string;
  title: string;
  displayValue?: string;
  description: string;
  details?: Details;
  status: StatusOptions;
  affectedMetrics?: string[];
  unscored?: boolean;
  stackPacks?: DiagnosticStackPack[];
};
