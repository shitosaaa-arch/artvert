import { processCustomerJobs } from "../lib/customers/jobs";
processCustomerJobs().then((count) => console.log(`customer-jobs:processed=${count}`)).catch((error) => { console.error(error); process.exitCode = 1; });
