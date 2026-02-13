import * as NodeSdk from '@effect/opentelemetry/NodeSdk';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { AlwaysOnSampler, BatchSpanProcessor } from '@opentelemetry/sdk-trace-base';
import { Config, Effect } from 'effect';

export const makeNodeObservabilityLayer = ({ serviceName }: { serviceName: string }) =>
  NodeSdk.layer(
    Effect.gen(function* () {
      const otlpBaseUrl = yield* Config.string('OTEL_EXPORTER_OTLP_ENDPOINT').pipe(
        Config.withDefault('http://localhost:4318'),
      );

      return {
        resource: { serviceName },
        tracerConfig: { sampler: new AlwaysOnSampler() },
        spanProcessor: new BatchSpanProcessor(
          new OTLPTraceExporter({
            url: new URL('v1/traces', otlpBaseUrl.endsWith('/') ? otlpBaseUrl : `${otlpBaseUrl}/`).toString(),
          }),
        ),
      };
    }),
  );
