export type StrictExtract<Source, Subset extends Source> = Subset;

export type CamelToScreamingSnake<S extends string> = S extends `${infer Head}${infer Tail}`
  ? Tail extends Uncapitalize<Tail>
    ? `${Uppercase<Head>}${CamelToScreamingSnake<Tail>}`
    : `${Uppercase<Head>}_${CamelToScreamingSnake<Tail>}`
  : S;

export type MapLiteralStep<T extends string> = {
  [K in T as CamelToScreamingSnake<T>]: K;
};
