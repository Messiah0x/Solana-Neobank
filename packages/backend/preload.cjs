'use strict';
// Preloaded via `node --require ./preload.cjs` before the server starts.
// rpc-websockets@9 requires uuid@14 (ESM-only) which crashes CJS.
// We intercept the require at module-load time and return a CJS shim instead.
const Module = require('module');
const crypto = require('crypto');

const uuidShim = {
  v1: () => crypto.randomUUID(),
  v4: () => crypto.randomUUID(),
};

const _load = Module._load;
Module._load = function (request, parent, isMain) {
  if (request === 'uuid' && parent && parent.filename && parent.filename.includes('rpc-websockets')) {
    return uuidShim;
  }
  return _load.apply(this, arguments);
};
