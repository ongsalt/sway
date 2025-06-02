// untested: chat gpt wrote this

export class DedupBucketPQ<T> {
  private buckets = new Map<number, Set<T>>();
  private activePriorities: number[] = [];

  insert(item: T, priority: number) {
    if (!this.buckets.has(priority)) {
      this.buckets.set(priority, new Set());
      // Insert priority in sorted order (binary insert)
      let i = this.activePriorities.findIndex(p => p > priority);
      if (i === -1) i = this.activePriorities.length;
      this.activePriorities.splice(i, 0, priority);
    }
    this.buckets.get(priority)!.add(item);
  }

  flush(): T[] {
    const result: T[] = [];
    for (const p of this.activePriorities) {
      result.push(...this.buckets.get(p)!);
    }
    this.buckets.clear();
    this.activePriorities.length = 0;
    return result;
  }
}
