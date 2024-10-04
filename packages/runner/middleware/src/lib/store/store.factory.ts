import { LocalStore, S3Store } from '@app-speed/runner-data-access-store';
import { AuditStore } from '@app-speed/runner-interfaces';

const storeMap = {
  local: LocalStore,
  s3: S3Store,
} as const;

type StoreKeys = keyof typeof storeMap;

function isInStoreMap(store: string): store is StoreKeys {
  return Object.keys(storeMap).includes(store);
}

export function createAuditStore(store: string): AuditStore {
  if (!isInStoreMap(store)) {
    throw new Error('Could not load Store!');
  }

  const Store = storeMap[store];
  return new Store() satisfies AuditStore;
}
