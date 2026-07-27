/**
 * Utility to generate country-specific USSD dial codes and telephone URLs for PAY NOW button.
 * - Rwanda (+250): *182*1*1*<ADMIN_NUMBER>#
 * - Burundi (+257): *165*1*1*<ADMIN_NUMBER>#
 */
export const getPayNowUssdDetails = (
  countryCode?: string,
  adminAccountNumber?: string,
  customUssdCode?: string
) => {
  const cleanAdminNumber = (adminAccountNumber || '69112233').replace(/\D/g, '');
  const code = (countryCode || '+257').trim();

  let ussdDisplay = '';

  if (customUssdCode && customUssdCode.trim() !== '' && customUssdCode.includes('*')) {
    if (customUssdCode.includes('NUMBER')) {
      ussdDisplay = customUssdCode.replace('NUMBER', cleanAdminNumber);
    } else {
      ussdDisplay = customUssdCode;
    }
  } else if (
    code === '+250' ||
    cleanAdminNumber.startsWith('250') ||
    cleanAdminNumber.startsWith('078') ||
    cleanAdminNumber.startsWith('079') ||
    cleanAdminNumber.startsWith('072') ||
    cleanAdminNumber.startsWith('073')
  ) {
    // RWANDA (MTN Mobile Money / Airtel Money USSD)
    ussdDisplay = `*182*1*1*${cleanAdminNumber}#`;
  } else {
    // BURUNDI (Lumicash / Ecocash / Econet USSD)
    ussdDisplay = `*165*1*1*${cleanAdminNumber}#`;
  }

  // Mobile phone tel: protocol requires encoding '#' as '%23'
  const telDialUrl = `tel:${ussdDisplay.replace(/#/g, '%23')}`;
  const directPhoneCallUrl = `tel:${cleanAdminNumber}`;

  return {
    ussdDisplay,
    telDialUrl,
    directPhoneCallUrl,
    cleanAdminNumber,
    countryCode: code,
    isRwanda: code === '+250',
    isBurundi: code === '+257',
  };
};
