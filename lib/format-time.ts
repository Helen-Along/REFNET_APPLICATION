export const formatTime = (timestamp: string | number | Date) => {
  const date = new Date(timestamp);

  // Format options for East African Time (UTC+3)
  const options: Intl.DateTimeFormatOptions = {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: "Africa/Nairobi",
  };

  return new Intl.DateTimeFormat("en-US", options).format(date);
};

import { toZonedTime } from "date-fns-tz";
export const formatOrderTime = (timestamp: string | number | Date) => {
  const date = new Date(timestamp);

  // Convert to UTC+3 (Nairobi Time)
  const nairobiTime = new Date(date.getTime() + 3 * 60 * 60 * 1000);

  console.log("Nairobi Time: >> ", nairobiTime);

  let hours = nairobiTime.getHours();
  const minutes = String(nairobiTime.getMinutes()).padStart(2, "0");
  const period = hours >= 12 ? "PM" : "AM";

  hours = hours % 12 || 12; // Convert to 12-hour format
  return `${hours}:${minutes} ${period}`;
};
