import { Context, Effect, Layer } from 'effect';
import { FetchHttpClient, HttpClient, HttpClientRequest } from '@effect/platform';

const makeConductorHttpClient = Effect.gen(function* () {
  const defaultClient = yield* HttpClient.HttpClient;
  const client = defaultClient.pipe(
    HttpClient.mapRequest(HttpClientRequest.prependUrl('http://localhost:3000/api/conductor')),
    HttpClient.filterStatusOk,
  );
  return client;
});

type MakeConductorHttpClientEffect = Effect.Effect.Success<typeof makeConductorHttpClient>;

class ConductorHttpClient extends Context.Tag('@ConductorHttpClient')<
  ConductorHttpClient,
  MakeConductorHttpClientEffect
>() {
  public static readonly Live = Layer.effect(this, makeConductorHttpClient).pipe(Layer.provide(FetchHttpClient.layer));
}
