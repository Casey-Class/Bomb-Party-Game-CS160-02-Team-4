import { Timer } from "./Timer";
import type { Player } from "./Player"; // Kalyn / Casey's class — import when ready

/**
 * Round class for Bomb Party
 * Manages a single round: the required letter string, the active timer,
 * and accepting / rejecting a word submission.
 *
 * UML fields:  -requiredString: String, -timer: Timer
 * UML methods: +startRound(), +endRound(),
 *              +acceptWord(player: Player, word: String): void
 */
export class Round {
  private requiredString: string; // the 2–3 letter combo players must use
  private timer: Timer;

  // Tracks words already used this round so they can't be repeated
  private usedWords: Set<string> = new Set();

  // Whether this round is currently in progress
  private active: boolean = false;

  // Callbacks the Game class can hook into
  private onWordAccepted: ((player: Player, word: string) => void) | null;
  private onWordRejected: ((player: Player, reason: string) => void) | null;
  private onTimerExpired: ((player: Player) => void) | null;

  // The player whose turn it currently is
  private currentPlayer: Player | null = null;

  /**
   * @param requiredString   - The letter combo shown on screen (e.g. "ST", "ING")
   * @param timerDuration    - Seconds allowed per turn (default 10)
   * @param onWordAccepted   - Fires when a valid word is submitted in time
   * @param onWordRejected   - Fires when a word is invalid (with a reason string)
   * @param onTimerExpired   - Fires when a player's time runs out
   */
  constructor(
    requiredString: string,
    timerDuration: number = 10,
    onWordAccepted: ((player: Player, word: string) => void) | null = null,
    onWordRejected: ((player: Player, reason: string) => void) | null = null,
    onTimerExpired: ((player: Player) => void) | null = null
  ) {
    if (requiredString.length < 2 || requiredString.length > 3) {
      throw new Error("requiredString must be 2–3 characters long");
    }

    this.requiredString = requiredString.toLowerCase();
    this.onWordAccepted = onWordAccepted;
    this.onWordRejected = onWordRejected;
    this.onTimerExpired = onTimerExpired;

    // Wire up the timer: when it expires, deduct a life from the current player
    this.timer = new Timer(
      timerDuration,
      null, // tick callback — Game can attach one if it needs live countdown UI
      () => {
        if (this.currentPlayer && this.onTimerExpired) {
          this.onTimerExpired(this.currentPlayer);
        }
      }
    );
  }


  /**
   * Begin a round for the given player.
   * Resets the timer and marks the round as active.
   */
  startRound(player: Player): void {
    this.currentPlayer = player;
    this.active = true;
    this.timer.reset();
    this.timer.start();
  }

  /**
   * End the current round (called when a valid word is accepted,
   * the timer expires, or the game needs to move to the next player).
   */
  endRound(): void {
    this.active = false;
    this.timer.stop();
    this.currentPlayer = null;
  }

  /**
   * @param player           - The player submitting the word
   * @param word             - The word they typed
   * @param isValidEnglishWord - Pre-validated by the Game / server dictionary
   */
  acceptWord(player: Player, word: string, isValidEnglishWord: boolean): void {
    const normalized = word.toLowerCase().trim();

    // Guard: round must be running
    if (!this.active) {
      this.onWordRejected?.(player, "Round is not active.");
      return;
    }

    // Guard: timer must still be running
    if (this.timer.isTimeUp()) {
      this.onWordRejected?.(player, "Time is up!");
      return;
    }

    // Guard: word must contain the required letter string
    if (!normalized.includes(this.requiredString)) {
      this.onWordRejected?.(
        player,
        `Word must contain "${this.requiredString.toUpperCase()}".`
      );
      return;
    }

    // Guard: word must not already have been used
    if (this.usedWords.has(normalized)) {
      this.onWordRejected?.(player, `"${word}" has already been used.`);
      return;
    }

    // Guard: must be a valid English word (Scrabble dictionary: checked externally)
    if (!isValidEnglishWord) {
      this.onWordRejected?.(player, `"${word}" is not a valid English word.`);
      return;
    }

    this.usedWords.add(normalized);
    this.onWordAccepted?.(player, normalized);
    this.endRound(); // stop the timer and clean up; Game will start the next turn
  }

  
  /** The letter combo required this round. */
  getRequiredString(): string {
    return this.requiredString;
  }

  /** Direct access to the Timer (so Game can attach a tick listener for the UI). */
  getTimer(): Timer {
    return this.timer;
  }

  /** Set of words already used — shared across all turns in the game. */
  getUsedWords(): Set<string> {
    return this.usedWords;
  }

  /** True while the round is counting down. */
  isActive(): boolean {
    return this.active;
  }

  /** The player whose turn it currently is, or null between turns. */
  getCurrentPlayer(): Player | null {
    return this.currentPlayer;
  }

  /**
   * Inject a pre-existing used-words set from the Game class.
   * This lets the no-repeat rule persist across multiple rounds.
   */
  setUsedWords(words: Set<string>): void {
    this.usedWords = words;
  }
}