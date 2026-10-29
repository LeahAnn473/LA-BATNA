import React from 'react';
import { Circle, MessageCircle, Target } from 'lucide-react';

const ICONS = { marble: Circle, clue: MessageCircle, ball: Target };

export default function GameIcon({ icon, className = 'h-5 w-5', strokeWidth = 1.7 }) {
  const Component = ICONS[icon] || Circle;
  return <Component className={className} strokeWidth={strokeWidth} />;
}