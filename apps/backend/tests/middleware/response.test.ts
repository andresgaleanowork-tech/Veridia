import { describe, it, expect, vi, beforeEach } from 'vitest';
import { apiResponse } from '../../src/middleware/response.js';

describe('API Response Middleware', () => {
  let req: any;
  let res: any;
  let next: any;

  beforeEach(() => {
    req = { id: 'test-request-id' };
    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    };
    next = vi.fn();
    apiResponse(req, res, next);
  });

  it('should attach response methods', () => {
    expect(typeof res.success).toBe('function');
    expect(typeof res.paginated).toBe('function');
    expect(typeof res.created).toBe('function');
    expect(typeof res.error).toBe('function');
  });

  describe('res.success', () => {
    it('should format success response', () => {
      const data = { id: 1, name: 'Test' };
      res.success(data);
      expect(res.json).toHaveBeenCalledWith({
        ok: true,
        data,
        meta: { requestId: 'test-request-id' },
      });
    });

    it('should include custom meta', () => {
      res.success({ id: 1 }, { custom: 'value' });
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ meta: expect.objectContaining({ custom: 'value' }) })
      );
    });
  });

  describe('res.paginated', () => {
    it('should format paginated response', () => {
      const data = [{ id: 1 }, { id: 2 }];
      res.paginated(data, 10, 1, 20);
      expect(res.json).toHaveBeenCalledWith({
        ok: true,
        data,
        meta: { requestId: 'test-request-id', total: 10, page: 1, limit: 20, pages: 1 },
      });
    });
  });

  describe('res.created', () => {
    it('should return 201 status', () => {
      res.created({ id: 1 });
      expect(res.status).toHaveBeenCalledWith(201);
    });
  });

  describe('res.error', () => {
    it('should format error response', () => {
      res.error(404, 'Not found');
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ ok: false, error: 'Not found' })
      );
    });
  });
});
