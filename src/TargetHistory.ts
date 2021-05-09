import {Target } from './types';

export function parseBibleTarget(search: string) {
  const m = search.match(/^(\w+).(\d+)(:([\d-,]+))*$/);
  if(m) {
    return {
        book: m[1],
        chapter: String(+m[2]),
        verse: m[4],
    }
  }
}

class TargetHistory {
  history: Target[];
  currentIndex: number;
  
  constructor(history: Target[] = [{mode: 'bible', search: ''}], currentIndex: number = 0) {
    this.history = history;
    this.currentIndex = currentIndex;
  }

  dup() {
    return new TargetHistory([...this.history], this.currentIndex);
  }

  object() {
    return {history: this.history, currentIndex: this.currentIndex};
  }

  moveHistory(increment: number) {
    const index = this.currentIndex + increment;
    if (0 <= index && index < this.history.length) {
      this.currentIndex = index;
      return true;
    } else {
      return false;
    }
  }

  addHistory(target: string) {
    if(parseBibleTarget(target)) {
      this.history = this.history.slice(0, this.currentIndex + 1);
      this.history.push({mode: 'bible', search: target});
      this.currentIndex = this.history.length - 1;
      return true;
    }
    return false;
  }

  incrementCurent(increment: number) {
    const current = this.current();
    if(current && current.mode === 'bible') {
      const result = parseBibleTarget(current.search);
      if(result) {
        if(result.verse) {
          const v = Number(result.verse)
          if(!isNaN(v)) {
            const verse = v + increment;
            if(verse > 0) {
              this.history[this.currentIndex].search = `${result.book}.${result.chapter}:${verse}`;
              return true;
            }
          }
        } else if(result.chapter) {
          const c = Number(result.chapter)
          if(!isNaN(c)) {
            const chapter = c + increment;
            if(chapter > 0) {
              this.history[this.currentIndex].search = `${result.book}.${chapter}`;
              return true;
            }
          }
        }
      }
    }
    return false;
  }

  current(): Target | null {
    if (0 <= this.currentIndex && this.currentIndex < this.history.length) {
      return this.history[this.currentIndex];
    } else {
      return null;
    }
  } 
}

export default TargetHistory;
