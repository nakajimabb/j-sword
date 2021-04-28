import Dexie from 'dexie';
import { Setting } from './types';

class SettingDB extends Dexie {
  settings: Dexie.Table<Setting, string>;
  constructor() {
    super('j-sword-setting');
    this.version(1).stores({
      settings: '&name',
    });
    this.settings = this.table('settings');
  }

  async getSetting(name: string) {
    return this.settings.get(name);
  }

  async saveSetting(setting: Setting) {
    return this.settings.put(setting);
  }

  async remove(name: string) {
    await this.settings.delete(name);
  }
}

export default new SettingDB();
