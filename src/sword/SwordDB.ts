import Dexie from 'dexie';
import {
  ModType,
  ConfType,
  BlobsType,
  ReferencesType,
  IndexesType,
} from './types';

class SwordDB extends Dexie {
  confs: Dexie.Table<ConfType, string>;
  blobs: Dexie.Table<BlobsType, string>;
  indexes: Dexie.Table<IndexesType, string>;
  references: Dexie.Table<ReferencesType, string>;
  constructor() {
    super('j-sword');
    this.version(1).stores({
      confs: '&modname',
      blobs: '&modname',
      indexes: '&modname',
      references: '&modname',
    });
    this.confs = this.table('confs');
    this.blobs = this.table('blobs');
    this.indexes = this.table('indexes');
    this.references = this.table('references');
  }

  async getConf(modname: string) {
    return this.confs.get(modname);
  }

  async getConfs(modtype: ModType) {
    if (modtype) {
      return this.confs
        .orderBy('modname')
        .filter((conf) => conf.modtype === modtype)
        .toArray();
    } else {
      return this.confs.orderBy('modname').toArray();
    }
  }

  async getBlob(modname: string) {
    return this.blobs.get(modname);
  }

  async getIndex(modname: string) {
    return this.indexes.get(modname);
  }

  async getReference(modname: string) {
    return this.references.get(modname);
  }

  async saveConf(conf: ConfType) {
    return this.confs.put(conf);
  }

  async saveBlob(blob: BlobsType) {
    return this.blobs.put(blob);
  }

  async saveIndex(index: IndexesType) {
    return this.indexes.put(index);
  }

  async saveReference(reference: ReferencesType) {
    return this.references.put(reference);
  }

  async remove(modname: string) {
    await this.confs.delete(modname);
    await this.blobs.delete(modname);
    await this.indexes.delete(modname);
    await this.references.delete(modname);
  }
}

export default new SwordDB();
