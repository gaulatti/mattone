import { ChevronDown, Check } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

export interface SelectOption {
  label: string;
  value: string;
}

interface SelectProps {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  error?: boolean;
}

export default function Select({ value, onChange, options, placeholder = 'Select...', disabled = false, className = '', error = false }: SelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Get selected option label
  const selectedOption = options.find((opt) => opt && opt.value === value);
  const displayValue = selectedOption ? selectedOption.label : placeholder;

  // Filter options based on search (with safety checks)
  const filteredOptions = options.filter((option) => option && option.label && option.label.toLowerCase().includes(searchTerm.toLowerCase()));

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;

    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setIsOpen(!isOpen);
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      setSearchTerm('');
    }
  };

  const handleSelect = (optionValue: string) => {
    onChange(optionValue);
    setIsOpen(false);
    setSearchTerm('');
  };

  return (
    <div className={`relative ${className}`}>
      <button
        ref={buttonRef}
        type='button'
        onClick={() => !disabled && setIsOpen(!isOpen)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        className={`
          w-full px-4 py-2 
          bg-white dark:bg-dark-sand 
          border ${error ? 'border-terracotta dark:border-terracotta' : 'border-sand/30 dark:border-sand/50'}
          rounded-lg 
          text-left
          font-[family-name:var(--font-sans)]
          text-text-primary dark:text-text-primary
          transition-all duration-200
          ${disabled ? 'opacity-50 cursor-not-allowed bg-sand/10' : 'hover:border-sea/50 dark:hover:border-accent-blue/50 cursor-pointer'}
          ${isOpen ? 'ring-2 ring-sea dark:ring-accent-blue border-sea dark:border-accent-blue' : ''}
          focus:outline-none focus:ring-2 focus:ring-sea dark:focus:ring-accent-blue
        `}
      >
        <div className='flex items-center justify-between'>
          <span className={selectedOption ? 'text-text-primary dark:text-text-primary' : 'text-text-secondary dark:text-text-secondary'}>{displayValue}</span>
          <ChevronDown
            size={18}
            className={`
              text-text-secondary dark:text-text-secondary 
              transition-transform duration-200
              ${isOpen ? 'rotate-180' : ''}
            `}
          />
        </div>
      </button>

      {isOpen && (
        <div
          ref={dropdownRef}
          className='
            absolute z-50 w-full mt-1
            bg-white dark:bg-dark-sand
            border border-sand/30 dark:border-sand/50
            rounded-lg
            shadow-lg dark:shadow-2xl
            overflow-hidden
            animate-in fade-in slide-in-from-top-1
          '
        >
          {/* Search input for long lists */}
          {options.length > 5 && (
            <div className='p-2 border-b border-sand/20 dark:border-sand/40'>
              <input
                type='text'
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder='Search...'
                className='
                  w-full px-3 py-1.5
                  bg-sand/5 dark:bg-sand/10
                  border border-sand/20 dark:border-sand/30
                  rounded
                  text-sm
                  text-text-primary dark:text-text-primary
                  placeholder:text-text-secondary dark:placeholder:text-text-secondary
                  focus:outline-none focus:ring-1 focus:ring-sea dark:focus:ring-accent-blue
                '
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          )}

          <div className='max-h-60 overflow-y-auto py-1'>
            {filteredOptions.length === 0 ? (
              <div className='px-4 py-3 text-sm text-text-secondary dark:text-text-secondary text-center'>No options found</div>
            ) : (
              filteredOptions.map((option) => {
                const isSelected = option.value === value;
                return (
                  <button
                    key={option.value}
                    type='button'
                    onClick={() => handleSelect(option.value)}
                    className={`
                      w-full px-4 py-2.5
                      flex items-center justify-between gap-2
                      text-left text-sm
                      transition-colors duration-150
                      ${
                        isSelected
                          ? 'bg-sea/10 dark:bg-accent-blue/10 text-sea dark:text-accent-blue font-medium'
                          : 'text-text-primary dark:text-text-primary hover:bg-sand/10 dark:hover:bg-sand/20'
                      }
                    `}
                  >
                    <span className='flex-1 tracking-refined'>{option.label}</span>
                    {isSelected && <Check size={16} className='flex-shrink-0 text-sea dark:text-accent-blue' />}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
