export const getCoverPosition = (url: string | null | undefined): string => {
  if (!url) return 'center 20%';
  const match = url.match(/#pos=(\d+)/);
  if (match && match[1]) {
    return `center ${match[1]}%`;
  }
  return 'center 20%';
};

export const extractBaseUrl = (url: string): string => {
  return url.split('#')[0];
};

export const extractPositionValue = (url: string | null | undefined): number => {
  if (!url) return 20;
  const match = url.match(/#pos=(\d+)/);
  if (match && match[1]) {
    return parseInt(match[1], 10);
  }
  return 20;
};
