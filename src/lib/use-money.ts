import { useCallback } from 'react';

import { CURRENCIES, DEFAULT_CURRENCY, formatMoney } from './currency';
import { formatAmountInput } from './format';
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
  const amountInput = useCallback(
    (value: string) => formatAmountInput(value, currencyCode),
    [currencyCode]
  );

  return { currency, currencyCode, money, amountInput };
}
