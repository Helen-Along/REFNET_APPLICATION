import { toZonedTime } from "date-fns-tz";
export const formatTime = (timestamp: string | number | Date) => {
  const date = new Date(timestamp);

  // Convert to UTC+3 (Nairobi Time)
  const nairobiTime = new Date(date.getTime() + (3 * 60) * 60 * 1000);

  console.log('Nairobi Time: >> ', nairobiTime);
  
  let hours = nairobiTime.getHours();
  const minutes = String(nairobiTime.getMinutes()).padStart(2, "0");
  const period = hours >= 12 ? "PM" : "AM";

  hours = hours % 12 || 12; // Convert to 12-hour format
  return `${hours}:${minutes} ${period}`;
};
