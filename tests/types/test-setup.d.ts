// Helpful ambient module for tests so editors/tsserver can resolve `@/*` imports
// used by test files. This keeps editors from reporting unresolved-module errors
// in test files that import from `@/...` paths.

declare module '@/*' {
    const anyModule: any;
    export = anyModule;
}
