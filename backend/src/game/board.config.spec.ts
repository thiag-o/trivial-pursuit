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
        { pos: 7, cat: 'geography' },
        { pos: 14, cat: 'entertainment' },
        { pos: 21, cat: 'history' },
        { pos: 28, cat: 'art' },
        { pos: 35, cat: 'science' },
        { pos: 42, cat: 'sports' },
      ];

      for (const { pos, cat } of hqPositions) {
        const tile = board.getTile(pos);
        expect(tile.type).toBe(TileType.HQ);
        expect(tile.category).toBe(cat);
      }
    });

    it('should return category tiles for regular ring positions', () => {
      const tile = board.getTile(1);
      expect(tile.type).toBe(TileType.CATEGORY);
      expect(tile.category).toBeDefined();
    });

    it('should return category tiles for spoke positions (43–72) — rotating categories (BR-1)', () => {
      const CATEGORY_CYCLE = [
        'geography',
        'entertainment',
        'history',
        'art',
        'science',
        'sports',
      ];
      // Spoke 0 (HQ=geography, spoke index 0): tiles 43–47
      // category = CATEGORY_CYCLE[(0 + tileIndex + 1) % 6]
      // tile 43 (idx 0): CATEGORY_CYCLE[1] = entertainment
      // tile 44 (idx 1): CATEGORY_CYCLE[2] = history
      // tile 47 (idx 4): CATEGORY_CYCLE[5] = sports
      const spoke0Categories = [43, 44, 45, 46, 47].map((pos, idx) => ({
        pos,
        expected: CATEGORY_CYCLE[(0 + idx + 1) % 6],
      }));
      for (const { pos, expected } of spoke0Categories) {
        const tile = board.getTile(pos);
        expect(tile.type).toBe(TileType.CATEGORY);
        expect(tile.category).toBe(expected);
      }

      // No spoke tile should be 'geography' in spoke 0 (the HQ category of spoke 0)
      for (let pos = 43; pos <= 47; pos++) {
        expect(board.getTile(pos).category).not.toBe('geography');
      }

      // Spoke 5 (HQ=sports, spoke index 5): tiles 68–72
      // tile 68 (idx 0): CATEGORY_CYCLE[(5+0+1)%6] = CATEGORY_CYCLE[0] = geography
      expect(board.getTile(68).category).toBe('geography');
      // tile 72 (idx 4): CATEGORY_CYCLE[(5+4+1)%6] = CATEGORY_CYCLE[4] = science
      expect(board.getTile(72).category).toBe('science');
    });

    it('should build exactly 73 tiles (hub + 42 ring + 30 spoke)', () => {
      for (let i = 0; i <= 72; i++) {
        expect(board.getTile(i)).toBeDefined();
      }
    });
  });

  describe('getValidDestinations', () => {
    // ── Hub ─────────────────────────────────────────────────────────────────
    it('should return 6 destinations from hub (one per spoke)', () => {
      const dests = board.getValidDestinations(0, 1);
      // dice=1 from hub → spoke tile adjacent to hub (index 4) for each spoke
      // Spoke 0: tiles[4]=47, Spoke 1: tiles[4]=52, ...
      expect(dests).toHaveLength(6);
      expect(dests).toContain(47); // spoke 0, tile index 4
      expect(dests).toContain(52); // spoke 1, tile index 4
      expect(dests).toContain(57); // spoke 2, tile index 4
      expect(dests).toContain(62); // spoke 3, tile index 4
      expect(dests).toContain(67); // spoke 4, tile index 4
      expect(dests).toContain(72); // spoke 5, tile index 4
    });

    it('should return HQ positions from hub with dice=6', () => {
      const dests = board.getValidDestinations(0, 6);
      expect(dests).toHaveLength(6);
      expect(dests).toContain(7);
      expect(dests).toContain(14);
      expect(dests).toContain(21);
      expect(dests).toContain(28);
      expect(dests).toContain(35);
      expect(dests).toContain(42);
    });

    it('should return spoke tile 0 from hub with dice=5', () => {
      const dests = board.getValidDestinations(0, 5);
      expect(dests).toContain(43); // spoke 0, tile index 0 (adjacent to HQ 7)
    });

    // ── Spoke tile navigation ────────────────────────────────────────────────
    it('should navigate spoke tile toward hub and toward ring', () => {
      // Spoke 0: [43,44,45,46,47], HQ=7
      // From tile index 2 (pos=45), dice=1: toward hub → tiles[3]=46; toward ring → tiles[1]=44
      const dests = board.getValidDestinations(45, 1);
      expect(dests).toContain(46); // toward hub
      expect(dests).toContain(44); // toward ring
      expect(dests).toHaveLength(2);
    });

    it('should reach hub from spoke tile adjacent to hub with dice=1 only when canAccessHub=true (BR-2)', () => {
      // Spoke 0, tile index 4 (pos=47), dice=1 → idx+1=5 → hub(0)
      const destsBlocked = board.getValidDestinations(47, 1, false);
      expect(destsBlocked).not.toContain(0); // hub blocked without 6 wedges

      const destsAllowed = board.getValidDestinations(47, 1, true);
      expect(destsAllowed).toContain(0); // hub allowed with 6 wedges
    });

    it('should reach HQ from spoke tile adjacent to HQ with dice=1', () => {
      // Spoke 0, tile index 0 (pos=43), dice=1 toward ring → idx-1=-1 → HQ(7)
      const dests = board.getValidDestinations(43, 1);
      expect(dests).toContain(7); // HQ
    });

    it('should return no hub-direction destination when overshoot', () => {
      // Spoke 0, tile index 4 (pos=47), dice=3 → toward hub: idx+3=7>5, no valid hub-dir
      const dests = board.getValidDestinations(47, 3);
      expect(dests).not.toContain(0);
    });

    // ── Ring tile navigation ─────────────────────────────────────────────────
    it('should return forward and backward from regular ring tile', () => {
      const dests = board.getValidDestinations(10, 3);
      expect(dests).toContain(13); // forward
      expect(dests).toContain(7); // backward → HQ, still valid
      expect(dests.length).toBeGreaterThanOrEqual(2);
    });

    it('should handle forward wrap-around past position 42', () => {
      // From 41, dice=3: forward=(41-1+3)%42+1=43%42+1=1+1=2 → 2 (not correct, let me trace)
      // (41-1+3)=43, 43%42=1, 1+1=2 → 2 ✓
      const dests = board.getValidDestinations(41, 3);
      expect(dests).toContain(2); // wraps around
    });

    it('should handle backward wrap-around past position 1', () => {
      // From 2, dice=5: backward=((2-1-5+42)%42)+1=((-4+42)%42)+1=38+1=39
      const dests = board.getValidDestinations(2, 5);
      expect(dests).toContain(39);
    });

    it('should include spoke entry from HQ ring tile', () => {
      // From HQ at 7, dice=3: ring forward, ring backward, spoke tile index 2 (=45)
      const dests = board.getValidDestinations(7, 3);
      expect(dests).toContain(45); // spoke entry at tiles[D-1] = tiles[2] = 45
    });

    it('should include hub from HQ ring tile with dice=6 only when canAccessHub=true (BR-2)', () => {
      const destsBlocked = board.getValidDestinations(14, 6, false);
      expect(destsBlocked).not.toContain(0); // hub blocked
      const destsAllowed = board.getValidDestinations(14, 6, true);
      expect(destsAllowed).toContain(0); // hub allowed
    });

    // ── BR-2: Hub blocked by default ──────────────────────────────────────────
    it('should never include hub in any path when canAccessHub=false (BR-2)', () => {
      // From HQ with dice=6: hub blocked
      expect(board.getValidDestinations(7, 6, false)).not.toContain(0);
      expect(board.getValidDestinations(42, 6, false)).not.toContain(0);
      // From spoke tile adjacent to hub with dice=1: hub blocked
      expect(board.getValidDestinations(47, 1, false)).not.toContain(0);
      expect(board.getValidDestinations(72, 1, false)).not.toContain(0);
    });

    // ── BR-3a: Spoke → ring overshoot ──────────────────────────────────────
    it('should extend spoke overshoot into ring (BR-3a)', () => {
      // Spoke 0 (HQ=7), tile index 0 (pos=43), dice=3
      // toward ring: idx - D = 0 - 3 = -3 < -1 → overshoot
      // remaining = D - idx - 1 = 3 - 0 - 1 = 2
      // fwd from HQ=7: ((7-1+2)%42)+1 = (8%42)+1 = 9
      // bwd from HQ=7: ((7-1-2+42)%42)+1 = (46%42)+1 = 4+1 = 5
      const dests = board.getValidDestinations(43, 3, false);
      expect(dests).toContain(9); // ring forward from HQ=7 + 2 steps
      expect(dests).toContain(5); // ring backward from HQ=7 + 2 steps
    });

    it('should extend spoke overshoot with remaining=1 (BR-3a)', () => {
      // Spoke 0 (HQ=7), tile index 0 (pos=43), dice=2
      // toward ring: 0 - 2 = -2 < -1 → overshoot
      // remaining = 2 - 0 - 1 = 1
      // fwd from HQ=7: ((7-1+1)%42)+1 = 7+1 = 8
      // bwd from HQ=7: ((7-1-1+42)%42)+1 = (47%42)+1 = 5+1 = 6
      const dests = board.getValidDestinations(43, 2, false);
      expect(dests).toContain(8);
      expect(dests).toContain(6);
      expect(dests).not.toContain(0); // hub still blocked
    });

    // ── BR-3b: Ring → spoke via in-path HQ ─────────────────────────────────
    it('should offer spoke entry when ring movement passes through an HQ (BR-3b)', () => {
      // From ring tile 5, dice=4
      // forward: ((5-1+4)%42)+1 = (8%42)+1 = 9
      // HQ=7 is 2 steps forward from 5: distFwd = (7-5+42)%42 = 2, 0<2<4
      // remaining = 4 - 2 = 2 → spoke.tiles[remaining-1] = spoke0.tiles[1] = 44
      const dests = board.getValidDestinations(5, 4, false);
      expect(dests).toContain(9); // forward ring destination
      expect(dests).toContain(44); // spoke entry via in-path HQ=7, remaining=2
    });

    it('should offer spoke entry when ring movement passes through HQ backward (BR-3b)', () => {
      // From ring tile 9, dice=4
      // backward: ((9-1-4+42)%42)+1 = (46%42)+1 = 4+1 = 5
      // HQ=7 is 2 steps backward from 9: distBwd = (9-7+42)%42 = 2, 0<2<4
      // remaining = 4 - 2 = 2 → spoke0.tiles[1] = 44
      const dests = board.getValidDestinations(9, 4, false);
      expect(dests).toContain(5); // backward ring destination
      expect(dests).toContain(44); // spoke entry via in-path HQ=7 backward
    });

    it('should not offer spoke entry when ring movement does NOT pass through HQ (BR-3b)', () => {
      // From ring tile 10, dice=2: forward=12, backward=8. No HQ in path (HQs at 7,14)
      // distFwd(10,14) = 4 (not < 2), distFwd(10,7) = 39 (not < 2)
      // distBwd(10,7) = 3 (not < 2), distBwd(10,14) = 38 (not < 2)
      const dests = board.getValidDestinations(10, 2, false);
      expect(dests).toHaveLength(2); // only forward + backward
      expect(dests).toContain(12);
      expect(dests).toContain(8);
    });
  });

  describe('SDN-01: spoke overshoot → raio oposto', () => {
    // Spoke 0 (Geography), idx=4 (pos 47), D=2
    // k=1, oppSpoke=3, tiles[4]=62
    it('should land on opposite spoke tile when overshoot (idx=4, D=2)', () => {
      const result = board.getValidDestinations(47, 2, false);
      expect(result).toContain(62); // SPOKES[3].tiles[4] — oposto de Spoke 0
    });

    // Spoke 0, idx=4 (pos 47), D=6
    // k=5, oppSpoke=3, tiles[0]=58
    it('should land on opposite spoke idx=0 tile when max overshoot (idx=4, D=6)', () => {
      const result = board.getValidDestinations(47, 6, false);
      expect(result).toContain(58); // SPOKES[3].tiles[0]
    });

    // Spoke 0, idx=0 (pos 43), D=6
    // k=1, oppSpoke=3, tiles[4]=62
    it('should land on opposite spoke when overshoot from idx=0 with D=6', () => {
      const result = board.getValidDestinations(43, 6, false);
      expect(result).toContain(62); // SPOKES[3].tiles[4]
    });

    // Raio 1 (Entertainment), idx=4 (pos 52), D=2
    // k=1, oppSpoke=4, tiles[4]=67
    it('should use correct opposite for spoke 1 → spoke 4', () => {
      const result = board.getValidDestinations(52, 2, false);
      expect(result).toContain(67); // SPOKES[4].tiles[4]
    });

    // Nenhum raio lateral deve aparecer
    it('should NOT include lateral spoke tiles when overshooting', () => {
      const result = board.getValidDestinations(47, 2, false);
      // raios laterais de Spoke 0: 1,2,4,5 → tiles: 48-52, 53-57, 63-67, 68-72
      const lateralTiles = [
        48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 63, 64, 65, 66, 67, 68, 69, 70,
        71, 72,
      ];
      for (const tile of lateralTiles) {
        expect(result).not.toContain(tile);
      }
    });
  });

  describe('SDN-02/03 verification: hub gate', () => {
    // Hub bloqueado sem fatias (spoke tile adjacente ao hub)
    it('should NOT include hub when canAccessHub=false (exact hub roll)', () => {
      // Spoke 0, idx=4 (pos 47), D=1 → idx+D=5 → exact hub
      const result = board.getValidDestinations(47, 1, false);
      expect(result).not.toContain(0);
    });

    // Hub liberado com fatias
    it('should include hub when canAccessHub=true (exact hub roll)', () => {
      const result = board.getValidDestinations(47, 1, true);
      expect(result).toContain(0);
    });

    // Hub bloqueado → ainda há destinos alternativos
    it('should have at least 1 alternative destination when hub is blocked', () => {
      // Spoke 0, idx=4 (pos 47), D=1 (exact hub), canAccessHub=false
      const result = board.getValidDestinations(47, 1, false);
      expect(result.length).toBeGreaterThanOrEqual(1);
      expect(result).not.toContain(0);
    });
  });

  describe('isValidPosition', () => {
    it('should accept valid positions 0–72', () => {
      expect(board.isValidPosition(0)).toBe(true);
      expect(board.isValidPosition(42)).toBe(true);
      expect(board.isValidPosition(72)).toBe(true);
    });

    it('should reject out-of-range and non-integer', () => {
      expect(board.isValidPosition(-1)).toBe(false);
      expect(board.isValidPosition(73)).toBe(false);
      expect(board.isValidPosition(1.5)).toBe(false);
    });
  });
});
