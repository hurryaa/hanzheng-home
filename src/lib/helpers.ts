export function cloneDeep<T>(value: T): T {
  if (value === null || value === undefined) {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map((item) => cloneDeep(item)) as unknown as T;
  }

  if (typeof value === 'object') {
    const cloned: Record<string, unknown> = {};
    for (const key in value) {
      if (Object.prototype.hasOwnProperty.call(value, key)) {
        cloned[key] = cloneDeep((value as Record<string, unknown>)[key]);
      }
    }
    return cloned as T;
  }

  return value;
}
