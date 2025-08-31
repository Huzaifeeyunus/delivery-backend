 
// src/lib/requestContext.ts
import { AsyncLocalStorage } from "async_hooks";

type Context = { userId?: number };

const als = new AsyncLocalStorage<Context>();

export function runWithContext<T>(context: Context, fn: () => T): T {
  return als.run(context, fn);
}

export function getRequestContext(): Context | undefined {
  return als.getStore();
}

