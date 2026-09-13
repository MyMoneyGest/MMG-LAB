import Svg, { Circle, Path, Rect } from 'react-native-svg';

// Icônes de la barre d'onglets de la fiche projet. Tracés simples en SVG :
// le projet n'embarque pas de librairie d'icônes, et un glyphe texte ne
// donnerait pas le même rendu d'une plateforme à l'autre.

const SIZE = 22;
const STROKE = 1.8;

export function HomeIcon({ color }: { color: string }) {
  return (
    <Svg width={SIZE} height={SIZE} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4 10.5 12 4l8 6.5V19a1 1 0 0 1-1 1h-4v-6H9v6H5a1 1 0 0 1-1-1z"
        stroke={color}
        strokeWidth={STROKE}
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function CalendarIcon({ color }: { color: string }) {
  return (
    <Svg width={SIZE} height={SIZE} viewBox="0 0 24 24" fill="none">
      <Rect
        x={3.5}
        y={5}
        width={17}
        height={15}
        rx={3}
        stroke={color}
        strokeWidth={STROKE}
      />
      <Path d="M3.5 9.5h17M8 3.5v3M16 3.5v3" stroke={color} strokeWidth={STROKE} strokeLinecap="round" />
    </Svg>
  );
}

export function ClockIcon({ color }: { color: string }) {
  return (
    <Svg width={SIZE} height={SIZE} viewBox="0 0 24 24" fill="none">
      <Circle cx={12} cy={12} r={8.5} stroke={color} strokeWidth={STROKE} />
      <Path d="M12 7.5V12l3 2" stroke={color} strokeWidth={STROKE} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}
