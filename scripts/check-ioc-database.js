const fs = require('fs');
const Module = require('module');
const ts = require('typescript');

require.extensions['.ts'] = (mod, filename) => {
  mod._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
      jsx: ts.JsxEmit.ReactJSX,
      esModuleInterop: true,
    },
  }).outputText, filename);
};
require.extensions['.tsx'] = require.extensions['.ts'];

const eqCalls = [];
const supabaseClient = {
  auth: {
    getUser: async () => ({ data: { user: null }, error: null }),
    getSession: async () => ({ data: { session: null }, error: null }),
    onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => undefined } } }),
  },
  from: () => {
    const builder = {
      select() { return builder; },
      eq(column, value) { eqCalls.push([column, value]); return builder; },
      is() { return builder; },
      order() { return Promise.resolve({ data: [], error: null }); },
      maybeSingle() { return Promise.resolve({ data: null, error: null }); },
    };
    return builder;
  },
  rpc: async () => ({ data: null, error: null }),
};

const originalLoad = Module._load;
Module._load = function(request, parent, isMain) {
  if (request === '@react-native-async-storage/async-storage') {
    return { getItem: async () => null, setItem: async () => undefined, removeItem: async () => undefined };
  }
  if (request === '@supabase/supabase-js') {
    return { createClient: () => supabaseClient };
  }
  return originalLoad.apply(this, arguments);
};

async function run() {
  const { iocContainer } = require('../src/app/models/ioc_container.ts');
  const database = iocContainer.getDatabase();

  if (typeof database.getOwnOrdersAsync !== 'function') {
    throw new Error('getDatabase() returned a database without getOwnOrdersAsync');
  }

  const result = await database.getOwnOrdersAsync('pharmacist-test-id');
  if (!Array.isArray(result)) {
    throw new Error('getOwnOrdersAsync did not delegate to an array result');
  }
  if (eqCalls.some(([column, value]) => column === 'pharmacist_id' && value === 'pharmacist-test-id')) {
    console.log('IoC database wiring check passed');
    return;
  }
  throw new Error('getOwnOrdersAsync did not apply the pharmacist_id filter');
}

run().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
