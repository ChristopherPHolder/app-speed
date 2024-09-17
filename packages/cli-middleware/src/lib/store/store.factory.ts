import { AuditStore } from '@app-speed/cli-interfaces';

const storeMap = {
  local: import('@app-speed/audit-store/local'),
  s3: import('@app-speed/audit-store/s3'),
} as const;

type StoreKeys = keyof typeof storeMap;

function isInStoreMap(store: string): store is StoreKeys {
  return Object.keys(storeMap).includes(store);
}

export async function createAuditStore(store: string): Promise<AuditStore> {
  if (!isInStoreMap(store)) {
    throw new Error('Could not load Store!');
  }

  const { default: Store } = await storeMap[store];
  return new Store() satisfies AuditStore;
}
