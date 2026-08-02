const enabled = (name: string, fallback = false) => process.env[name] === "true" || (process.env[name] === undefined && fallback);
export const flags = { vision: () => enabled("FEATURE_VISION", true), customerAccounts: () => enabled("FEATURE_CUSTOMER_ACCOUNTS", true), analytics: () => enabled("FEATURE_ANALYTICS", true), futureAi: () => enabled("FEATURE_FUTURE_AI", false) } as const;
