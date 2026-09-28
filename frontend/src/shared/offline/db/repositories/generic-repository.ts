import type { Table } from 'dexie';

/**
 * Repositorio Genérico para operaciones CRUD en tablas IndexedDB.
 * Proporciona métodos tipados, transaccionales y de alto rendimiento.
 */
export class GenericLocalRepository<T, Key extends string | number> {
  protected readonly table: Table<T, Key>;

  constructor(table: Table<T, Key>) {
    this.table = table;
  }

  async findById(id: Key): Promise<T | undefined> {
    return this.table.get(id);
  }

  async findAll(): Promise<T[]> {
    return this.table.toArray();
  }

  async save(item: T): Promise<Key> {
    return this.table.put(item);
  }

  async saveBatch(items: T[]): Promise<Key[]> {
    if (items.length === 0) return [];
    return this.table.bulkPut(items, { allKeys: true });
  }

  async delete(id: Key): Promise<void> {
    await this.table.delete(id);
  }

  async deleteBatch(ids: Key[]): Promise<void> {
    if (ids.length === 0) return;
    await this.table.bulkDelete(ids);
  }

  async clear(): Promise<void> {
    await this.table.clear();
  }

  async count(): Promise<number> {
    return this.table.count();
  }

  getTable(): Table<T, Key> {
    return this.table;
  }
}
