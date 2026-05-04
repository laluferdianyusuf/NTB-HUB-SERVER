export const isMobile = (userAgent: string = "") => {
  return /android|iphone|ipad|ipod/i.test(userAgent);
};

export const isAndroid = (userAgent: string = "") => {
  return /android/i.test(userAgent);
};

export const isIOS = (userAgent: string = "") => {
  return /iphone|ipad|ipod/i.test(userAgent);
};
