/**
 * Player class for Bomb Party
 * Handles word submission and score addition
 * Contains additional fields to match our mock game
 *
 * UML fields:  -id: String, -name: String, -score: int
 * UML methods: +submitWord(word: String), +addScore(points: int)
 */

import type { Player as IPlayer } from "@/data/mock-game.ts";

export class Player implements IPlayer{
    private _id: string;
    private _name: string;
    private _score: number;

    // additional fields needed based on game logic
    public avatarColor: string;
    public avatarUrl: string | null;
    public currentWord: string | null;
    public isActive: boolean;
    public isConnected: boolean;
    public isEliminated: boolean;
    public lives: number;
    public maxLives: number;

    constructor(data: IPlayer) {
        this._id = data.id;
        this._name = data.name;
        this._score = data.score;

        this.avatarColor = data.avatarColor;
        this.avatarUrl = data.avatarUrl;
        this.currentWord = data.currentWord;
        this.isActive = data.isActive;
        this.isConnected = data.isConnected;
        this.isEliminated = data.isEliminated;
        this.lives = data.lives;
        this.maxLives = data.maxLives;
    }

    // Getters to allow read-access to private UML fields
    get id(): string { return this._id; }
    get name(): string { return this._name; }
    get score(): number { return this._score; }

    /** UML method: +addScore(points: int) */
    public addScore(points: number): void {
        this._score += points;
    }

    /** UML method: +submitWord(word: string) */
    public submitWord(word: string): void {
        this.currentWord = word.trim();
    }
}
