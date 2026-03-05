import { Chess, type Square, type Move } from 'chess.js';
import { pixelToSquare } from './Board';
import { findBestMove } from './AI';
import { triggerCaptureFade } from './PieceRenderer';

export type GameResult = 'playing' | 'checkmate-win' | 'checkmate-loss' | 'stalemate' | 'draw';

export class GameController {
  public chess: Chess;
  public selectedSquare: Square | null = null;
  public legalMoves: Square[] = [];
  public lastMove: { from: Square; to: Square } | null = null;
  public gameResult: GameResult = 'playing';
  public playerColor: 'w' | 'b' = 'w';
  public aiThinking = false;

  private onGameOver: ((result: GameResult) => void) | null = null;

  constructor() {
    this.chess = new Chess();
  }

  setOnGameOver(callback: (result: GameResult) => void): void {
    this.onGameOver = callback;
  }

  reset(): void {
    this.chess = new Chess();
    this.selectedSquare = null;
    this.legalMoves = [];
    this.lastMove = null;
    this.gameResult = 'playing';
    this.aiThinking = false;
  }

  handleClick(canvasX: number, canvasY: number): void {
    if (this.gameResult !== 'playing') return;
    if (this.aiThinking) return;
    if (this.chess.turn() !== this.playerColor) return;

    const clickedSquare = pixelToSquare(canvasX, canvasY);
    if (!clickedSquare) return;

    // If a piece is already selected
    if (this.selectedSquare) {
      // Check if clicking on one of the legal move targets
      if (this.legalMoves.includes(clickedSquare)) {
        this.makePlayerMove(this.selectedSquare, clickedSquare);
        return;
      }

      // Check if clicking on another own piece to re-select
      const piece = this.chess.get(clickedSquare);
      if (piece && piece.color === this.playerColor) {
        this.selectPiece(clickedSquare);
        return;
      }

      // Otherwise deselect
      this.deselect();
      return;
    }

    // No piece selected: try to select one
    const piece = this.chess.get(clickedSquare);
    if (piece && piece.color === this.playerColor) {
      this.selectPiece(clickedSquare);
    }
  }

  private selectPiece(square: Square): void {
    this.selectedSquare = square;
    // Get legal moves for this square
    const moves = this.chess.moves({ square, verbose: true }) as Move[];
    this.legalMoves = moves.map(m => m.to);
  }

  private deselect(): void {
    this.selectedSquare = null;
    this.legalMoves = [];
  }

  private makePlayerMove(from: Square, to: Square): void {
    // Check for pawn promotion
    const piece = this.chess.get(from);
    let promotion: string | undefined;
    if (piece && piece.type === 'p') {
      const targetRank = to[1];
      if ((piece.color === 'w' && targetRank === '8') || (piece.color === 'b' && targetRank === '1')) {
        promotion = 'q'; // auto-promote to queen
      }
    }

    // Check if target has a piece (capture)
    const targetPiece = this.chess.get(to);
    if (targetPiece) {
      triggerCaptureFade(to, targetPiece.color, targetPiece.type);
    }

    try {
      const move = this.chess.move({ from, to, promotion });
      this.lastMove = { from: move.from, to: move.to };
      this.deselect();

      if (this.checkGameOver()) return;

      // Trigger AI move after delay
      this.aiThinking = true;
      setTimeout(() => this.makeAIMove(), 300);
    } catch {
      // Illegal move - deselect
      this.deselect();
    }
  }

  private makeAIMove(): void {
    if (this.chess.isGameOver()) {
      this.aiThinking = false;
      return;
    }

    const bestMove = findBestMove(this.chess);
    if (!bestMove) {
      this.aiThinking = false;
      return;
    }

    // Check if AI captures a piece
    const moveObj = this.chess.moves({ verbose: true }).find(m => m.san === bestMove || `${m.from}${m.to}` === bestMove);
    if (moveObj && moveObj.captured) {
      const targetPiece = this.chess.get(moveObj.to);
      if (targetPiece) {
        triggerCaptureFade(moveObj.to, targetPiece.color, targetPiece.type);
      }
    }

    try {
      const move = this.chess.move(bestMove);
      this.lastMove = { from: move.from, to: move.to };
    } catch {
      // Should not happen with a valid AI move
    }

    this.aiThinking = false;
    this.checkGameOver();
  }

  private checkGameOver(): boolean {
    if (!this.chess.isGameOver()) return false;

    if (this.chess.isCheckmate()) {
      // The side whose turn it is has been checkmated
      this.gameResult = this.chess.turn() === this.playerColor ? 'checkmate-loss' : 'checkmate-win';
    } else if (this.chess.isStalemate()) {
      this.gameResult = 'stalemate';
    } else {
      this.gameResult = 'draw';
    }

    if (this.onGameOver) {
      this.onGameOver(this.gameResult);
    }

    return true;
  }

  get isCheck(): boolean {
    return this.chess.isCheck();
  }

  get currentTurn(): 'w' | 'b' {
    return this.chess.turn();
  }

  get statusText(): string {
    switch (this.gameResult) {
      case 'checkmate-win':
        return 'CHECKMATE - YOU WIN';
      case 'checkmate-loss':
        return 'CHECKMATE - YOU LOSE';
      case 'stalemate':
        return 'STALEMATE - DRAW';
      case 'draw':
        return 'DRAW';
      default:
        if (this.aiThinking) return 'AI THINKING...';
        if (this.isCheck) return 'CHECK!';
        return this.chess.turn() === this.playerColor ? 'YOUR TURN' : 'AI TURN';
    }
  }
}
