import { BoardConfig } from './board.config';
import { TileType } from '../common/enums';

describe('BoardConfig', () => {
  let board: BoardConfig;

  beforeEach(() => {
    board = new BoardConfig();
  });

  describe('getTile', () => {
    it('should return hub tile for position 0', () => {
      const tile = board.getTile(0);
      expect(tile.position).toBe(0);
      expect(tile.type).toBe(TileType.HUB);
      expect(tile.category).toBeNull();
    });

    it('should return HQ tiles at correct positions', () => {
      const hqPositions = [
        { pos: 5, cat: 'geography' },
        { pos: 10, cat: 'entertainment' },
        { pos: 15, cat: 'history' },
        { pos: 20, cat: 'art' },
        { pos: 25, cat: 'science' },
        { pos: 30, cat: 'sports' },
      ];

      for (const { pos, cat } of hqPositions) {
        const tile = board.getTile(pos);
        expect(tile.type).toBe(TileType.HQ);
        expect(tile.category).toBe(cat);
      }
    });

    it('should return rollAgain for designated positions', () => {
      const rollAgainPositions = [3, 9, 14, 19, 24, 29, 35, 41, 47, 53, 59, 65];
      for (const pos of rollAgainPositions) {
        const tile = board.getTile(pos);
        expect(tile.type).toBe(TileType.ROLL_AGAIN);
      }
    });

    it('should return category tiles for regular positions', () => {
      const tile = board.getTile(1);
      expect(tile.type).toBe(TileType.CATEGORY);
      expect(tile.category).toBeDefined();
    });

    it('should build exactly 73 tiles (hub + 72 ring)', () => {
      // Positions 0..72 should all be defined
      for (let i = 0; i <= 72; i++) {
        expect(board.getTile(i)).toBeDefined();
      }
    });
  });

  describe('getValidDestinations', () => {
    it('should return single destination from hub', () => {
      const dests = board.getValidDestinations(0, 4);
      expect(dests).toEqual([4]);
    });

    it('should return forward and backward from ring', () => {
      const dests = board.getValidDestinations(10, 3);
      expect(dests).toContain(13);
      expect(dests).toContain(7);
      expect(dests).toHaveLength(2);
    });

    it('should handle forward wrap-around past position 72', () => {
      // forward: 70+5=75 → 75-72+1-1 = 3
      const dests = board.getValidDestinations(70, 5);
      expect(dests).toContain(3);
      expect(dests).toContain(65);
    });

    it('should handle backward wrap-around past position 1', () => {
      // backward: 2-5=-3 → 72+(-3)-1+1 = 69
      const dests = board.getValidDestinations(2, 5);
      expect(dests).toContain(7);
      expect(dests).toContain(69);
    });

    it('should deduplicate when forward equals backward', () => {
      // From 1, dice 36: forward=37, backward=1-36=-35 → 72-35-1+1=37
      const dests = board.getValidDestinations(1, 36);
      expect(dests).toHaveLength(1);
      expect(dests).toContain(37);
    });
  });

  describe('isValidPosition', () => {
    it('should accept valid positions 0-72', () => {
      expect(board.isValidPosition(0)).toBe(true);
      expect(board.isValidPosition(36)).toBe(true);
      expect(board.isValidPosition(72)).toBe(true);
    });

    it('should reject out-of-range and non-integer', () => {
      expect(board.isValidPosition(-1)).toBe(false);
      expect(board.isValidPosition(73)).toBe(false);
      expect(board.isValidPosition(1.5)).toBe(false);
    });
  });
});
