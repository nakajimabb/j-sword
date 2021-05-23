import { zeroPadding } from './tools';
import { Target } from './types';
import { parseBibleTarget, parseWordTarget } from './sword/parseTarget';

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

  prevHistory(size: number) {
    return this.history.slice(this.currentIndex - size, this.currentIndex).reverse();
  }

  nextHistory(size: number) {
    return this.history.slice(this.currentIndex + 1, this.currentIndex + size + 1);
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

  addHistory(search: string) {
    const current = this.current();
    let mode: 'bible' | 'word' | 'text' | undefined = current?.mode;
    if(current && current.search !== search) {
      if(parseBibleTarget(search)) {
        mode = 'bible';
      } else if(parseWordTarget(search)) {
        mode = 'word';
      }
      if(mode) {
        this.history = this.history.slice(0, this.currentIndex + 1);
        this.history.push({mode, search});
        this.currentIndex = this.history.length - 1;
      }
    }
    return mode;
  }

  incrementCurent(increment: number) {
    const current = this.current();
    if(!current) return false;

    if(current.mode === 'bible') {
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
    } else if(current.mode === 'word'){
      const m = current.search.match(/^([GH])(\d+)$/);
      if(m) {
        const number = +m[2] + increment;
        if(number > 0) {
          this.history[this.currentIndex].search = `${m[1]}${zeroPadding(number, 4)}`;
          return true;
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
