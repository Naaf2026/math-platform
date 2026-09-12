import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !key) return null;

  const client = createBrowserClient(url, key);
  const originalRpc = client.rpc.bind(client);

  // Route legacy Mission answer calls through the atomic mission RPC.
  const proxiedClient = new Proxy(client, {
    get(target, property, receiver) {
      if (property === "rpc") {
        return (...rpcArgs: any[]) => {
          const [functionName, params, options] = rpcArgs;

          if (functionName === "submit_learning_answer") {
            return originalRpc("submit_daily_mission_answer", params, options).then(
              ({ data, error }) => {
                if (error) return { data, error };
                const row = Array.isArray(data) ? data[0] : data;
                return {
                  data: row
                    ? [{
                        is_correct: row.is_correct,
                        correct_answer: row.correct_answer,
                        explanation: row.explanation,
                        xp_awarded: row.xp_awarded,
                      }]
                    : [],
                  error: null,
                };
              },
            );
          }

          return originalRpc(functionName, params, options);
        };
      }

      return Reflect.get(target, property, receiver);
    },
  });

  return proxiedClient;
}
