import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !key) return null;

  const client = createBrowserClient(url, key);
  const originalRpc = client.rpc.bind(client);

  // Keep Mission and Daily Challenge on the shared learning submission API.
  // The database function now detects whether the question belongs to today's
  // Mission and routes it to the correct atomic submission path.
  const proxiedClient = new Proxy(client, {
    get(target, property, receiver) {
      if (property === "rpc") {
        return (...rpcArgs: any[]) => {
          const [functionName, params, options] = rpcArgs;

          if (functionName === "submit_learning_answer") {
            return originalRpc("submit_learning_answer", params, options);
          }

          // Mission submission is atomic in submit_learning_answer. The legacy
          // Mission page still makes this compatibility call, so don't attempt
          // to update Mission progress a second time.
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
