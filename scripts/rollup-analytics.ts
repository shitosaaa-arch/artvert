import { rollupAnalytics } from "../lib/analytics/service";
const end = new Date(); const start = new Date(end.getTime() - 24 * 60 * 60 * 1000);
rollupAnalytics(start, end).then((count) => console.log(`analytics-rollup:groups=${count}`)).catch((error) => { console.error(error); process.exitCode = 1; });
