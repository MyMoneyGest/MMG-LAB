import { useCallback } from 'react';

import { CURRENCIES, DEFAULT_CURRENCY, formatMoney, maskMoney } from './currency';
import { formatAmountInput } from './format';
import { useStore } from './store';

/** Devise active et formateur réactif partagés par les écrans de l'application. */
export function useMoney() {
  const storedCode = useStore((state) => state.currencyCode);
  const hideAmounts = useStore((state) => state.hideAmounts);
  const currencyCode = storedCode ?? DEFAULT_CURRENCY;
  const currency = CURRENCIES[currencyCode];
  const money = useCallback(
    (amount: number) => formatMoney(amount, currencyCode),
    [currencyCode]
  );
  /**
   * Montant lisible D'UN COUP D'ŒIL, donc masquable : ceux qu'un voisin de
   * métro ou quelqu'un à qui on prête son téléphone verrait sans rien toucher.
   *
   * Volontairement distinct de `money` plutôt que posé dedans. Masquer partout
   * serait absurde : dans une modale de saisie, l'utilisateur a ouvert l'écran
   * exprès et doit voir ce qu'il tape. Le choix se fait donc à l'appel, et les
   * montants protégés restent visibles dans le code.
   */
  const glance = useCallback(
    (amount: number) =>
      hideAmounts ? maskMoney(currencyCode) : formatMoney(amount, currencyCode),
    [hideAmounts, currencyCode]
  );
  const amountInput = useCallback(
    (value: string) => formatAmountInput(value, currencyCode),
    [currencyCode]
  );

  return { currency, currencyCode, money, glance, hideAmounts, amountInput };
}
