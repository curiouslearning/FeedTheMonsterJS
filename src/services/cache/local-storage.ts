export class LocalStorageCache {
  constructor(protected namespace = 'FTM') {}
  
  clear() {
    localStorage.removeItem(this.namespace)
  }

  get(key: string) {
    return this.getStorage()[key];
  }

  remove(key: string) {
    const data = this.getStorage();
    data[key] = undefined;
    delete data[key];
    this.save(data);
  }

  set(key: string, value: any) {
    const data = this.getStorage();
    data[key] = value;
    this.save(data);
  }

  private getStorage() {
    const storage = localStorage.getItem(this.namespace);
    if (storage) return this.deserialize(storage);
    return {};
  }

  private serialize(value: any) {
    return JSON.stringify(value);
  }

  private deserialize(value: any) {
    return JSON.parse(value);
  }

  private save(data) {
    localStorage.setItem(this.namespace, this.serialize(data));
  }
}
