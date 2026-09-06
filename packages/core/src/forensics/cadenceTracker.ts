import { KeystrokeCadenceProfile } from './types.js';

export class CadenceTracker {
  private timestamps: number[] = [];
  private maxHistory: number = 50;

  public recordKeypress(timestamp: number = Date.now()): void {
    this.timestamps.push(timestamp);
    if (this.timestamps.length > this.maxHistory) {
      this.timestamps.shift();
    }
  }

  public reset(): void {
    this.timestamps = [];
  }

  public analyzeCadence(): KeystrokeCadenceProfile {
    if (this.timestamps.length < 3) {
      return {
        averageIntervalMs: 150,
        varianceMs: 40,
        samplesCount: this.timestamps.length,
        isNaturalHuman: true,
      };
    }

    const intervals: number[] = [];
    for (let i = 1; i < this.timestamps.length; i++) {
      intervals.push(this.timestamps[i] - this.timestamps[i - 1]);
    }

    const sum = intervals.reduce((acc, v) => acc + v, 0);
    const mean = sum / intervals.length;

    const squareDiffs = intervals.map((v) => Math.pow(v - mean, 2));
    const variance = squareDiffs.reduce((acc, v) => acc + v, 0) / intervals.length;

    // Human typing characteristic: average interval between 60ms and 800ms, with natural variance > 10ms
    const isNaturalHuman = mean >= 40 && mean <= 1000 && variance >= 5;

    return {
      averageIntervalMs: Math.round(mean),
      varianceMs: Math.round(variance),
      samplesCount: intervals.length,
      isNaturalHuman,
    };
  }
}
