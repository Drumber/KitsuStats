export function filterLibraryEntriesForType(libraryEntries, mediaType) {
  return libraryEntries.filter((e) => {
    return e.relationships[mediaType].data !== null;
  });
}
