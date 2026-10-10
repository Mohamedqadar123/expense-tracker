import 'dotenv/config';
import app from './app.js';
import { startRecurringTransactionScheduler } from './scheduler.js';
import { detectLanAppUrl, getAppUrl } from './utils/appUrl.js';

const port = process.env.PORT || 3001;

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
  startRecurringTransactionScheduler();
  if (process.env.NODE_ENV !== 'production') {
    detectLanAppUrl().then(() => console.log(`Links in emails point to ${getAppUrl()}`));
  }
});
