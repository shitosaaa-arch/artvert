import { cleanupCustomerRetention } from "../lib/customers/jobs";
cleanupCustomerRetention().then((result) => console.log(`customer-retention:tokens=${result.tokens},sessions=${result.sessions},images=${result.images}`)).catch((error) => { console.error(error); process.exitCode = 1; });
