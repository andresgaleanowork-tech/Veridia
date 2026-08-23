const { describe, it } = require('node:test');
const assert = require('node:assert');

const { apiResponse } = require('../src/middleware/response');

describe('apiResponse helpers', () => {
  it('res.success devuelve ok:true y data', () => {
    const req = { id: 'req-1' };
    const jsonCalls = [];
    const res = {
      json: (body) => { jsonCalls.push(body); },
    };

    apiResponse(req, res, () => {});
    res.success({ foo: 'bar' });

    assert.strictEqual(jsonCalls.length, 1);
    assert.strictEqual(jsonCalls[0].ok, true);
    assert.deepStrictEqual(jsonCalls[0].data, { foo: 'bar' });
    assert.strictEqual(jsonCalls[0].meta.requestId, 'req-1');
  });

  it('res.created devuelve status 201 y ok:true', () => {
    const req = { id: 'req-2' };
    const jsonCalls = [];
    let statusCode = 200;
    const res = {
      status: (code) => { statusCode = code; return res; },
      json: (body) => { jsonCalls.push(body); },
    };

    apiResponse(req, res, () => {});
    res.created({ id: 42 });

    assert.strictEqual(statusCode, 201);
    assert.strictEqual(jsonCalls[0].ok, true);
    assert.deepStrictEqual(jsonCalls[0].data, { id: 42 });
  });

  it('res.paginated devuelve ok:true, data y meta con total/page/limit', () => {
    const req = { id: 'req-3' };
    const jsonCalls = [];
    const res = {
      json: (body) => { jsonCalls.push(body); },
    };

    apiResponse(req, res, () => {});
    res.paginated([{ id: 1 }], 100, 2, 10);

    assert.strictEqual(jsonCalls.length, 1);
    assert.strictEqual(jsonCalls[0].ok, true);
    assert.deepStrictEqual(jsonCalls[0].data, [{ id: 1 }]);
    assert.deepStrictEqual(jsonCalls[0].meta, {
      requestId: 'req-3',
      total: 100,
      page: 2,
      limit: 10,
      pages: 10,
    });
  });

  it('res.error devuelve status correcto, ok:false y error message', () => {
    const req = { id: 'req-4' };
    const jsonCalls = [];
    let statusCode = 200;
    const res = {
      status: (code) => { statusCode = code; return res; },
      json: (body) => { jsonCalls.push(body); },
    };

    apiResponse(req, res, () => {});
    res.error(404, 'Not found');

    assert.strictEqual(statusCode, 404);
    assert.strictEqual(jsonCalls[0].ok, false);
    assert.strictEqual(jsonCalls[0].error, 'Not found');
    assert.ok(jsonCalls[0].meta.timestamp);
    assert.strictEqual(jsonCalls[0].meta.requestId, 'req-4');
  });
});
