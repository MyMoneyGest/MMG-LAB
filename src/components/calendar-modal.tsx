import { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, fonts, radius } from '@/constants/theme';
import { formatDate, formatMonth } from '@/lib/format';

// Sélecteur de date en calendrier mensuel : on choisit un jour en le voyant
// dans son mois, au lieu de taper JJ/MM/AAAA. Écrit à la main plutôt qu'avec
// une librairie — le projet n'en embarque aucune pour les dates, et un mois
// de 42 cellules ne justifie pas une dépendance.
//
// Les jours hors bornes restent visibles mais inertes : masquer une semaine
// entière ferait perdre le repère visuel du mois.

const WEEKDAYS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function sameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/** Grille de 6 semaines commençant un lundi, cases vides comprises. */
function monthGrid(year: number, month: number): (Date | null)[] {
  const first = new Date(year, month, 1);
  // getDay() renvoie 0 pour dimanche : on décale pour une semaine lundi→dimanche.
  const lead = (first.getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (Date | null)[] = Array.from({ length: lead }, () => null);
  for (let day = 1; day <= daysInMonth; day += 1) cells.push(new Date(year, month, day));
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

export function CalendarModal({
  visible,
  value,
  minDate,
  maxDate,
  title = 'Choisir une date',
  onSelect,
  onClose,
}: {
  visible: boolean;
  value: Date | null;
  /** Premier jour choisissable (inclus). */
  minDate?: Date;
  /** Dernier jour choisissable (inclus). */
  maxDate?: Date;
  title?: string;
  onSelect: (date: Date) => void;
  onClose: () => void;
}) {
  const insets = useSafeAreaInsets();
  const initial = value ?? minDate ?? new Date();
  const [cursor, setCursor] = useState(
    () => new Date(initial.getFullYear(), initial.getMonth(), 1)
  );

  // Rouvrir la feuille repositionne le calendrier sur la date retenue, plutôt
  // que sur le mois consulté la fois précédente.
  useEffect(() => {
    if (!visible) return;
    const anchor = value ?? minDate ?? new Date();
    setCursor(new Date(anchor.getFullYear(), anchor.getMonth(), 1));
  }, [visible, value, minDate]);

  const today = startOfDay(new Date());
  const min = minDate ? startOfDay(minDate) : null;
  const max = maxDate ? startOfDay(maxDate) : null;
  const cells = monthGrid(cursor.getFullYear(), cursor.getMonth());
  const outOfRange = (date: Date) =>
    Boolean((min && date < min) || (max && date > max));

  const shiftMonth = (delta: number) =>
    setCursor((current) => new Date(current.getFullYear(), current.getMonth() + delta, 1));

  // Une flèche est inerte quand tout le mois visé sort des bornes.
  const prevBlocked = Boolean(
    min && new Date(cursor.getFullYear(), cursor.getMonth(), 0) < min
  );
  const nextBlocked = Boolean(
    max && new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1) > max
  );

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable
          accessibilityViewIsModal
          style={[styles.sheet, { paddingBottom: Math.max(insets.bottom + 8, 20) }]}
          onPress={() => {}}>
          <View style={styles.grabber} />
          <View style={styles.header}>
            <Text style={styles.title}>{title}</Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Fermer"
              onPress={onClose}
              hitSlop={10}
              style={styles.closeButton}>
              <Text style={styles.closeLabel}>✕</Text>
            </Pressable>
          </View>

          <View style={styles.monthBar}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Mois précédent"
              disabled={prevBlocked}
              onPress={() => shiftMonth(-1)}
              hitSlop={8}
              style={({ pressed }) => [
                styles.monthArrow,
                prevBlocked && styles.monthArrowDisabled,
                pressed && styles.monthArrowPressed,
              ]}>
              <Text style={styles.monthArrowLabel}>‹</Text>
            </Pressable>
            <Text style={styles.monthLabel}>
              {formatMonth(cursor)} {cursor.getFullYear()}
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Mois suivant"
              disabled={nextBlocked}
              onPress={() => shiftMonth(1)}
              hitSlop={8}
              style={({ pressed }) => [
                styles.monthArrow,
                nextBlocked && styles.monthArrowDisabled,
                pressed && styles.monthArrowPressed,
              ]}>
              <Text style={styles.monthArrowLabel}>›</Text>
            </Pressable>
          </View>

          <View style={styles.weekRow}>
            {WEEKDAYS.map((day, index) => (
              <Text key={`${day}-${index}`} style={styles.weekday}>
                {day}
              </Text>
            ))}
          </View>

          <View style={styles.grid}>
            {cells.map((date, index) => {
              if (!date) return <View key={`empty-${index}`} style={styles.cell} />;
              const disabled = outOfRange(date);
              const selected = value ? sameDay(date, value) : false;
              return (
                <Pressable
                  key={date.toISOString()}
                  accessibilityRole="button"
                  accessibilityState={{ selected, disabled }}
                  accessibilityLabel={formatDate(date)}
                  disabled={disabled}
                  onPress={() => onSelect(date)}
                  style={styles.cell}>
                  <View
                    style={[
                      styles.day,
                      selected && styles.daySelected,
                      !selected && sameDay(date, today) && styles.dayToday,
                    ]}>
                    <Text
                      style={[
                        styles.dayLabel,
                        selected && styles.dayLabelSelected,
                        disabled && styles.dayLabelDisabled,
                      ]}>
                      {date.getDate()}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(30, 22, 16, 0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.card,
    borderTopLeftRadius: radius.card,
    borderTopRightRadius: radius.card,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  grabber: {
    width: 42,
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.border,
    alignSelf: 'center',
    marginBottom: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  title: { fontFamily: fonts.sansBold, fontSize: 20, color: colors.text },
  closeButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.cardSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeLabel: { fontFamily: fonts.sansSemiBold, fontSize: 14, color: colors.textSecondary },
  monthBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  monthArrow: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthArrowPressed: { backgroundColor: colors.cardSoft },
  monthArrowDisabled: { opacity: 0.35 },
  monthArrowLabel: { fontSize: 24, lineHeight: 26, fontWeight: '700', color: colors.text },
  monthLabel: {
    flex: 1,
    textAlign: 'center',
    fontFamily: fonts.serifBold,
    fontSize: 19,
    color: colors.text,
    textTransform: 'capitalize',
  },
  weekRow: { flexDirection: 'row', marginTop: 4, marginBottom: 2 },
  weekday: {
    flex: 1,
    textAlign: 'center',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
    color: colors.textSecondary,
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: { width: `${100 / 7}%`, aspectRatio: 1, alignItems: 'center', justifyContent: 'center' },
  day: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  daySelected: { backgroundColor: colors.accent },
  dayToday: { borderWidth: 1, borderColor: colors.cardSoftBorder },
  dayLabel: { fontSize: 15, fontWeight: '700', color: colors.text },
  dayLabelSelected: { color: '#FFFFFF' },
  dayLabelDisabled: { color: colors.textSecondary, opacity: 0.4 },
});
