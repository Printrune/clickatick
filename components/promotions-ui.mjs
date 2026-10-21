export function codeFieldErrors(error) {
  const fields = Array.isArray(error?.fields) ? error.fields : [];
  return Object.fromEntries(fields
    .filter(field => (field.path === 'promoCode' || field.path === 'referralCode') && typeof field.message === 'string')
    .map(field => [field.path, field.message]));
}

export function quoteCodeFields({promotionsEnabled, referralsEnabled, promoCode, referralCode}) {
  if (!promotionsEnabled && !referralsEnabled) return {};
  return {
    promoCode: promotionsEnabled ? promoCode.trim() || null : null,
    referralCode: referralsEnabled ? referralCode.trim() || null : null,
  };
}

export function pricingLines(pricing, fallbackSubtotalMinor) {
  if (!pricing) return [{label: 'Illustrative ticket subtotal', amountMinor: fallbackSubtotalMinor}];
  return [
    {label: 'Original ticket price', amountMinor: pricing.originalTicketSubtotalMinor},
    {label: 'Promotion discount', amountMinor: -pricing.discountMinor},
    {label: 'Discounted ticket price', amountMinor: pricing.discountedTicketSubtotalMinor},
  ];
}
