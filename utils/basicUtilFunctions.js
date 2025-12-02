export const capitalizer = (str) => {
  return str
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

// Convert date to Indian Standard Time (IST) in ISO format
export const toIndianISOString = (date) => {
  // Get the time in IST by adjusting the UTC time
  // IST is UTC+5:30
  const utcTime = date.getTime();
  const istOffset = 5.5 * 60 * 60 * 1000; // 5 hours 30 minutes in milliseconds
  const istTime = new Date(utcTime + istOffset);

  // Get ISO string and adjust for IST offset
  const isoString = istTime.toISOString();
  return isoString;
};
