function isLocalHostname(hostname: string) {
  return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "[::1]";
}

export function getSumoPodReturnUrls(siteUrl: string, orderNumber: string) {
  try {
    const baseUrl = new URL(siteUrl);
    if (!["http:", "https:"].includes(baseUrl.protocol) || isLocalHostname(baseUrl.hostname)) {
      return {};
    }

    return {
      success_return_url: new URL(
        `/payment/success?order=${encodeURIComponent(orderNumber)}`,
        baseUrl,
      ).toString(),
      cancel_return_url: new URL(
        `/payment/cancel?order=${encodeURIComponent(orderNumber)}`,
        baseUrl,
      ).toString(),
    };
  } catch {
    return {};
  }
}
