/**
 * Timer class for Bomb Party
 * Tracks time remaining for each player's turn.
 *
 * UML fields:  -duration: int, -timeRemaining: int
 * UML methods: +start(), +stop(), +reset(), +isTimeUp(): boolean
 */

export class Timer {
  private duration: number; // total turn duration in seconds
  private timeRemaining: number; // seconds left on the clock
  private intervalId: ReturnType<typeof setInterval> | null = null;

  // Callbacks so the Round/Game can react to tick and expiry events
  private onTick: ((timeRemaining: number) => void) | null;
  private onExpire: (() => void) | null;

  /**
   * @param duration   - How many seconds each turn lasts (default 10)
   * @param onTick     - Called every second with the updated time remaining
   * @param onExpire   - Called once when the timer reaches 0
   */
  constructor(
    duration: number = 10,
    onTick: ((timeRemaining: number) => void) | null = null,
    onExpire: (() => void) | null = null
  ) {
    this.duration = duration;
    this.timeRemaining = duration;
    this.onTick = onTick;
    this.onExpire = onExpire;
  }


  /** Starts counting down from the current timeRemaining value. */
  start(): void {
    if (this.intervalId !== null) return; // already running

    this.intervalId = setInterval(() => {
      this.timeRemaining -= 1;

      if (this.onTick) {
        this.onTick(this.timeRemaining);
      }

      if (this.timeRemaining <= 0) {
        this.stop();
        if (this.onExpire) {
          this.onExpire();
        }
      }
    }, 1000);
  }

  /** Pauses the countdown without resetting it. */
  stop(): void {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  /** Stops the timer and restores timeRemaining to the original duration. */
  reset(): void {
    this.stop();
    this.timeRemaining = this.duration;
  }

  /** Returns true once the countdown has reached zero. */
  isTimeUp(): boolean {
    return this.timeRemaining <= 0;
  }


  /** Seconds left in the current turn. */
  getTimeRemaining(): number {
    return this.timeRemaining;
  }

  /** The full turn duration this timer was created with. */
  getDuration(): number {
    return this.duration;
  }

  /** True while the interval is actively ticking. */
  isRunning(): boolean {
    return this.intervalId !== null;
  }

  /**
   * Update the turn duration.
   * Only takes effect after the next reset() call.
   */
  setDuration(seconds: number): void {
    if (seconds <= 0) throw new Error("Duration must be greater than 0");
    this.duration = seconds;
  }
}