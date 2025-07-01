import { showHUD, LaunchProps } from "@raycast/api";
import axios from 'axios';

export default async function main(props: LaunchProps) {
  const { arguments: args } = props;

  await trackPizza(args.orderId);
}


const MAX_ATTEMPTS = 40;
const POLL_INTERVAL_MS = 15_000;

let counter = 0;
let prevStatus = '';

async function trackPizza(orderId: string) {
  try {
    const apiUrl = `https://www.dominos.se/api/order/${orderId}/track`;
    const response = await axios.get(apiUrl);
    const data = response.data;

    const status: string = data?.status;
    const minWait: number = data?.minimumEstimatedWaitTimeInMinutes;
    const maxWait: number = data?.maximumEstimatedWaitTimeInMinutes;

    if (!status || status === 'null') {
      await showHUD('Error: Invalid or missing status in response.');
      return;
    }

    if (status === 'Delivered') {
      await showHUD('Your pizza is ready for pickup!');
      return;
    }

    if (status !== prevStatus || counter % 4 === 0) {
      // Update the HUD only if the status has changed or every 4 attempts (once per minute)
      await showHUD(`Pizza Status: ${status} (Wait: ${minWait}-${maxWait} min)`);
      prevStatus = status;
    }
  } catch (err) {
    console.error('Error fetching order status:', err);
    await showHUD('Error: Unable to fetch order status. Please check your order ID.');
    return;
  }

  counter++;
  if (counter < MAX_ATTEMPTS) {
    await timeout(POLL_INTERVAL_MS);
    console.log(`Attempt ${counter}: Checking status...`);
    await trackPizza(orderId);
  } else {
    console.log('Tracking ended after 20 minutes.');
    await showHUD('Tracking ended after 20 minutes. Please check your order status manually.');
    return;
  }
}

function timeout(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}