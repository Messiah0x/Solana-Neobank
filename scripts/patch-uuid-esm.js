'use strict';
const path = require('path');
const fs = require('fs');

// rpc-websockets@9 nests uuid@14 (ESM-only) which crashes CJS require().
// Deleting the nested copy forces Node to resolve uuid from the root,
// which is pinned to v8 (CommonJS) via the overrides field in package.json.
const nestedUuid = path.join(__dirname, '..', 'node_modules', 'rpc-websockets', 'node_modules', 'uuid');

if (fs.existsSync(nestedUuid)) {
  fs.rmSync(nestedUuid, { recursive: true, force: true });
  console.log('patch-uuid-esm: removed rpc-websockets/node_modules/uuid (was v14 ESM) — will now use hoisted uuid@8');
} else {
  console.log('patch-uuid-esm: nothing to patch');
}
