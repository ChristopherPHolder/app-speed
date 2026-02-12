import * as NodeSdk from '@effect/opentelemetry/NodeSdk';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { AlwaysOnSampler, BatchSpanProcessor } from '@opentelemetry/sdk-trace-base';

const otlpBaseUrl = process.env.OTEL_EXPORTER_OTLP_ENDPOINT ?? 'http://localhost:4318';
const serviceName = process.env.OTEL_SERVICE_NAME ?? 'server';

const toTracesUrl = (baseUrl: string) =>
  new URL('v1/traces', baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`).toString();

export const ObservabilityLive = NodeSdk.layer(() => ({
  resource: {
    serviceName,
  },
  tracerConfig: {
    sampler: new AlwaysOnSampler(),
  },
  spanProcessor: new BatchSpanProcessor(
    new OTLPTraceExporter({
      url: toTracesUrl(otlpBaseUrl),
    }),
  ),
}));
