import React from 'react';
import * as Popover from '@radix-ui/react-popover';

interface ColorSelectorProps {
  onColorSelect: (color: string) => void;
}

const colors = [
  { name: 'Yellow', value: '#fef08a' },
  { name: 'Green', value: '#bbf7d0' },
  { name: 'Blue', value: '#bfdbfe' },
  { name: 'Pink', value: '#fbcfe8' },
  { name: 'Purple', value: '#ddd6fe' },
  { name: 'Orange', value: '#fed7aa' },
];

export const ColorSelector: React.FC<ColorSelectorProps> = ({ onColorSelect }) => {
  return (
    <div className="p-2 bg-white rounded-lg shadow-lg border border-gray-200 min-w-[120px]">
      <div className="grid grid-cols-3 gap-2">
        {colors.map((color) => (
          <button
            key={color.name}
            onClick={() => onColorSelect(color.value)}
            className="w-8 h-8 rounded-full hover:scale-110 transition-transform border border-gray-200 flex items-center justify-center"
            style={{ backgroundColor: color.value }}
            title={color.name}
          />
        ))}
      </div>
    </div>
  );
};