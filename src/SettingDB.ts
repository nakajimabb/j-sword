import Dexie from 'dexie';
import { Setting } from './types';

class SettingDB extends Dexie {
  settings: Dexie.Table<Setting, string>;
  constructor() {
    super('j-sword-setting');
    this.version(1).stores({
      settings: '&uid',
    });
    this.settings = this.table('settings');
  }

  async getSetting(uid: string) {
    return this.settings.get(uid);
  }

  async saveSetting(setting: Setting) {
    return this.settings.put(setting);
  }

  async remove(uid: string) {
    await this.settings.delete(uid);
  }
}

export default new SettingDB();
