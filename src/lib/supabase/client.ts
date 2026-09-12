import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !key) return null;

  const client = createBrowserClient(url, key);
  const originalRpc = client.rpc.bind(client);

  // Route the legacy Mission submission call directly to the atomic RPC.
  // This avoids any stale PostgREST client schema/function-resolution issue.
  const proxiedClient = new Proxy(client, {
    get(target, property, receiver) {
      if (property === "rpc") {
        return (...rpcArgs: any[]) => {
          const [functionName, params, options] = rpcArgs;

          if (functionName === "submit_learning_answer") {
            return client.auth.getSession().then(async ({ data: sessionData, error: sessionError }) => {
              if (sessionError) return { data: null, error: sessionError };

              const accessToken = sessionData.session?.access_token;
              if (!accessToken) {
                return {
                  data: null,
                  error: new Error("Authentication session is missing. Please sign in again."),
                };
              }

              try {
                const response = await fetch(`${url}/rest/v1/rpc/submit_daily_mission_answer`, {
                  method: "POST",
                  headers: {
                    apikey: key,
                    Authorization: `Bearer ${accessToken}`,
                    "Content-Type": "application/json",
                    Accept: "application/json",
                  },
                  body: JSON.stringify(params ?? {}),
                });

                const raw = await response.text();
                let parsed: any = null;
                try {
                  parsed = raw ? JSON.parse(raw) : null;
                } catch {
                  parsed = raw;
                }

                if (!response.ok) {
                  const message = typeof parsed === "object" && parsed?.message
                    ? parsed.message
                    : `Mission submission failed (HTTP ${response.status}).`;
                  const error = Object.assign(new Error(message), {
                    code: typeof parsed === "object" ? parsed?.code : undefined,
                    details: typeof parsed === "object" ? parsed?.details : undefined,
                    hint: typeof parsed === "object" ? parsed?.hint : undefined,
                    status: response.status,
                  });
                  console.error("Mission submission RPC failed", error, parsed);
                  return { data: null, error };
                }

                const row = Array.isArray(parsed) ? parsed[0] : parsed;
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
              } catch (error) {
                console.error("Mission submission network error", error);
                return { data: null, error };
              }
            });
          }

          return originalRpc(functionName, params, options);
        };
      }

      return Reflect.get(target, property, receiver);
    },
  });

  return proxiedClient;
}
