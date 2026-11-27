export interface StorageReadResult<T> {
  value: T;
  persistedAvailable: boolean;
}

export function readStorageValue<T>(
  key: string,
  validate: (raw: string | null) => T,
): StorageReadResult<T> {
  try {
    const raw = window.localStorage.getItem(key);
    return { value: validate(raw), persistedAvailable: true };
  } catch {
    return { value: validate(null), persistedAvailable: false };
  }
}

export function writeStorageValue(key: string, value: string): boolean {
  try {
    window.localStorage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}
