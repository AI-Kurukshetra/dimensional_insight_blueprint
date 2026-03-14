export function validateIncomingRecords<T extends Record<string, unknown>>(records: T[]) {
  return records.map((record, index) => ({
    index,
    valid: Object.values(record).every((value) => value !== null && value !== ""),
    record
  }));
}
