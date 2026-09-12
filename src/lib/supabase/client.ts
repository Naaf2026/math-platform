import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !key) return null;

  const client = createBrowserClient(url, key);
  const originalRpc = client.rpc.bind(client);

  // Keep the existing Mission page compatible while routing its legacy
  // submission call through a dedicated, uniquely named RPC. This avoids
  // PostgREST schema/function-resolution collisions with older functions.
  const proxiedClient = new Proxy(client, {
    get(target, property, receiver) {
      if (property === "rpc") {
        return (...rpcArgs: any[]) => {
          const [functionName, params, options] = rpcArgs;

          if (functionName === "submit_learning_answer") {
            return originalRpc("submit_mission_answer_v2", params, options);
          }

          // submit_mission_answer_v2 already updates the Daily Mission
          // atomically. The legacy page makes a second progress call, so
          // intentionally treat that compatibility call as a no-op.
          if (functionName === "record_daily_mission_answer") {
            return Promise.resolve({ data: null, error: null });
          }

          return originalRpc(functionName, params, options);
        };
      }

      return Reflect.get(target, property, receiver);
    },
  });

  return proxiedClient;
}
