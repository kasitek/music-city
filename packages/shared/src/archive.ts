export interface ArchiveRecord {
  id: string;
  trackId: string;
  storageKey: string;
  metadataKey: string;
  wrappedKey: string;
  iv: string;
  authTag: string;
  remoteUrl?: string;
  createdAt: string;
}
