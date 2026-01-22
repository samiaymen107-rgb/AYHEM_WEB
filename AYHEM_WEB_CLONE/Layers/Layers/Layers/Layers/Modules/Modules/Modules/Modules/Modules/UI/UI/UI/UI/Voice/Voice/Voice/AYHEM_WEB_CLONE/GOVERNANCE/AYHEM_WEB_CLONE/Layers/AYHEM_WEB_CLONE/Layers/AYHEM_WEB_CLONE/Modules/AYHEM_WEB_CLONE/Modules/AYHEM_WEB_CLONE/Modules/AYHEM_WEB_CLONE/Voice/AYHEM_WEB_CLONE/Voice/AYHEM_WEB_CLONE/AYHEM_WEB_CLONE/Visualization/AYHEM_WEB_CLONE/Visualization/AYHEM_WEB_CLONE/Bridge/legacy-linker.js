// يربط أي ملف قديم بنظيره CLONE

export function linkLegacy(oldPath, clonePath) {
  return {
    legacy: oldPath,
    clone: clonePath,
    mode: "READ_ONLY",
    synced: true
  };
}
