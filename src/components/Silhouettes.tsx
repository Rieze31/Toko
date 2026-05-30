import React from 'react';
import Svg, { Path, Ellipse, G, Rect, Circle } from 'react-native-svg';

interface Props { color: string; size?: number }

export function ShirtSilhouette({ color, size = 40 }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 40 40">
      <Path
        d="M12 6 L4 13 L8 15 L8 33 L32 33 L32 15 L36 13 L28 6 L25 9 C23 11 17 11 15 9 Z"
        fill={color} fillOpacity={0.18} stroke={color} strokeWidth={1} strokeLinejoin="round"
      />
    </Svg>
  );
}

export function TrouserSilhouette({ color, size = 40 }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 40 40">
      <Path
        d="M10 8 L10 20 L16 34 L20 34 L20 20 L20 34 L24 34 L30 20 L30 8 Z"
        fill={color} fillOpacity={0.18} stroke={color} strokeWidth={1} strokeLinejoin="round"
      />
    </Svg>
  );
}

export function SneakerSilhouette({ color, size = 40 }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 40 40">
      <Path
        d="M5 26 Q7 19 13 18 L19 16 Q23 15 26 18 L35 21 Q38 24 35 27 L5 27 Z"
        fill={color} fillOpacity={0.18} stroke={color} strokeWidth={1} strokeLinejoin="round"
      />
    </Svg>
  );
}

export function JacketSilhouette({ color, size = 40 }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 40 40">
      <Path
        d="M13 4 L4 13 L8 14 L8 34 L18 34 L18 14 L20 14 L20 34 L32 34 L32 14 L36 13 L27 4 L24 7 L20 12 L16 7 Z"
        fill={color} fillOpacity={0.18} stroke={color} strokeWidth={1} strokeLinejoin="round"
      />
    </Svg>
  );
}

export function BodyCanvas({
  topColor, bottomColor, shoeColor, jacketColor,
}: {
  topColor: string; bottomColor: string; shoeColor: string; jacketColor: string | null;
}) {
  const skin = '#E8C9A0';
  const hair = '#2A201A';
  return (
    <Svg viewBox="0 0 200 460" style={{ width: '55%', height: '100%' }}>
      {/* Shadow */}
      <Ellipse cx={100} cy={448} rx={48} ry={7} fill="rgba(0,0,0,0.07)" />
      {/* Shoes */}
      <Path d="M 52,394 L 47,413 Q 43,424 53,426 L 94,426 L 94,394 Z" fill={shoeColor} />
      <Path d="M 148,394 L 153,413 Q 157,424 147,426 L 106,426 L 106,394 Z" fill={shoeColor} />
      {/* Pants */}
      <Path d="M 52,228 L 47,257 L 52,394 L 94,394 L 100,268 L 80,228 Z" fill={bottomColor} />
      <Path d="M 148,228 L 153,257 L 148,394 L 106,394 L 100,268 L 120,228 Z" fill={bottomColor} />
      {/* Shirt */}
      <Path d="M 58,90 L 22,104 L 18,174 L 50,178 L 50,228 L 150,228 L 150,178 L 182,174 L 178,104 L 142,90 C 128,82 120,80 100,80 C 80,80 72,82 58,90 Z" fill={topColor} />
      {/* Forearms */}
      <Path d="M 18,174 L 12,228 Q 10,238 21,240 L 42,240 Q 50,238 50,228 L 50,178 Z" fill={skin} />
      <Path d="M 182,174 L 188,228 Q 190,238 179,240 L 158,240 Q 150,238 150,228 L 150,178 Z" fill={skin} />
      {/* Jacket overlay */}
      {jacketColor && (
        <G>
          <Path d="M 56,90 L 18,102 L 14,176 L 46,180 L 46,228 L 100,228 L 100,114 C 96,96 80,82 56,90 Z" fill={jacketColor} />
          <Path d="M 144,90 L 182,102 L 186,176 L 154,180 L 154,228 L 100,228 L 100,114 C 104,96 120,82 144,90 Z" fill={jacketColor} />
          <Circle cx={100} cy={152} r={2} fill="rgba(0,0,0,0.2)" />
          <Circle cx={100} cy={172} r={2} fill="rgba(0,0,0,0.2)" />
          <Circle cx={100} cy={192} r={2} fill="rgba(0,0,0,0.2)" />
        </G>
      )}
      {/* Neck */}
      <Rect x={92} y={74} width={16} height={16} rx={5} fill={skin} />
      {/* Head + hair */}
      <Path d="M 70,48 Q 70,8 100,6 Q 130,8 130,48 Q 126,30 100,28 Q 74,30 70,48 Z" fill={hair} />
      <Ellipse cx={70} cy={50} rx={6} ry={8} fill={skin} />
      <Ellipse cx={130} cy={50} rx={6} ry={8} fill={skin} />
      <Ellipse cx={100} cy={50} rx={32} ry={34} fill={skin} />
      <Path d="M 69,48 Q 70,8 100,6 Q 130,8 131,48 Q 126,28 100,26 Q 74,28 69,48 Z" fill={hair} />
      {/* Eyes */}
      <Ellipse cx={89} cy={47} rx={4} ry={4.5} fill={hair} />
      <Ellipse cx={111} cy={47} rx={4} ry={4.5} fill={hair} />
      <Circle cx={90.5} cy={45.5} r={1.4} fill="white" fillOpacity={0.65} />
      <Circle cx={112.5} cy={45.5} r={1.4} fill="white" fillOpacity={0.65} />
      {/* Mouth */}
      <Path d="M 93,67 Q 100,72 107,67" stroke="#C07858" strokeWidth={1.8} strokeLinecap="round" fill="none" fillOpacity={0.55} />
    </Svg>
  );
}