import { useCallback } from 'react';

import { CURRENCIES, DEFAULT_CURRENCY, formatMoney } from './currency';
import { useStore } from './store';

/** Devise active et formateur réactif partagés par les écrans de l'application. */
export function useMoney() {
  const storedCode = useStore((state) => state.currencyCode);
  const currencyCode = storedCode ?? DEFAULT_CURRENCY;
  const currency = CURRENCIES[currencyCode];
  const money = useCallback(
    (amount: number) => formatMoney(amount, currencyCode),
    [currencyCode]
  );

  return { currency, currencyCode, money };
}
