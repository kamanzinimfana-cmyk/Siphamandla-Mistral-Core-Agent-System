export class SimpleMemory {
  store: any = {};

  async get() {
    return this.store;
  }

  async set(data: any) {
    this.store = { ...this.store, ...data };
  }
}
