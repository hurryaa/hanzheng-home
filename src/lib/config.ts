const missingApiUrlMessage =
  'VITE_API_URL is not defined. Copy .env.example to .env and set the value, or configure it in your deployment environment (e.g. Vercel project settings).';

const rawApiUrl = import.meta.env.VITE_API_URL?.trim();
const normalizedApiUrl = rawApiUrl
  ? rawApiUrl.endsWith('/')
    ? rawApiUrl.slice(0, -1)
    : rawApiUrl
  : undefined;

if (!normalizedApiUrl) {
  if (import.meta.env.DEV) {
    throw new Error(missingApiUrlMessage);
  }

  console.warn(missingApiUrlMessage);
}

export const config = {
  apiUrl: normalizedApiUrl
} as const;

export const getApiUrl = (): string => {
  if (!normalizedApiUrl) {
    throw new Error(missingApiUrlMessage);
  }

  return normalizedApiUrl;
};
