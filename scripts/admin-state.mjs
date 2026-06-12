const changedFiles = new Set();

export function markChanged(filePath) {
  changedFiles.add(filePath);
}

export function getChanged() {
  return [...changedFiles];
}

export function hasChanges() {
  return changedFiles.size > 0;
}

export function clearChanged() {
  changedFiles.clear();
}
