import { Fragment } from 'react';
import { COMMON_CITIES } from '@/utils/constants';

interface CitySelectProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  required?: boolean;
}

export default function CitySelect({ 
  value, 
  onChange, 
  placeholder = "Select or type a city...",
  className = "",
  required = false 
}: CitySelectProps) {
  return (
    <>
      <input
        type="text"
        list="cities-list"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={className}
        required={required}
      />
      <datalist id="cities-list">
        {COMMON_CITIES.map((city) => {
          const cityName = city.split(',')[0].trim();
          return <option key={city} value={cityName}>{city}</option>;
        })}
      </datalist>
    </>
  );
}