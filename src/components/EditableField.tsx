import React, { useState, useCallback } from 'react';
import { validateTicker, validatePercentage, validateShares, validateCostPerShare, validateNotes, sanitizeInput } from '../utils/validation';

interface EditableFieldProps {
  value: string | number;
  field: 'ticker' | 'targetPercent' | 'numberOfShares' | 'costPerShare' | 'notes';
  onUpdate: (value: string | number) => void;
  className?: string;
  placeholder?: string;
  'aria-label'?: string;
}

export const EditableField: React.FC<EditableFieldProps> = ({
  value,
  field,
  onUpdate,
  className = '',
  placeholder,
  'aria-label': ariaLabel,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClick = useCallback(() => {
    setIsEditing(true);
    setError(null);
  }, []);

  const handleBlur = useCallback(() => {
    setIsEditing(false);
    setError(null);
  }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleBlur();
    } else if (e.key === 'Escape') {
      setIsEditing(false);
      setError(null);
    }
  }, [handleBlur]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    let validationResult;

    switch (field) {
      case 'ticker':
        validationResult = validateTicker(newValue);
        break;
      case 'targetPercent':
        validationResult = validatePercentage(newValue);
        break;
      case 'numberOfShares':
        validationResult = validateShares(newValue);
        break;
      case 'costPerShare':
        validationResult = validateCostPerShare(newValue);
        break;
      case 'notes':
        validationResult = validateNotes(newValue);
        break;
      default:
        validationResult = { isValid: true };
    }

    if (validationResult.isValid) {
      setError(null);
      if (field === 'targetPercent') {
        onUpdate(parseFloat(newValue) / 100);
      } else if (field === 'numberOfShares' || field === 'costPerShare') {
        onUpdate(parseFloat(newValue));
      } else {
        onUpdate(sanitizeInput(newValue));
      }
    } else {
      setError(validationResult.error || 'Invalid input');
    }
  }, [field, onUpdate]);

  const formatValue = useCallback(() => {
    if (field === 'targetPercent') {
      return ((value as number) * 100).toFixed(2);
    }
    if (field === 'costPerShare') {
      return (value as number).toFixed(2);
    }
    if (field === 'numberOfShares') {
      return (value as number).toLocaleString();
    }
    return String(value);
  }, [value, field]);

  if (isEditing) {
    const inputProps = {
      onBlur: handleBlur,
      onKeyDown: handleKeyDown,
      onChange: handleChange,
      onFocus: (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => e.target.select(),
      autoFocus: true,
      placeholder,
      'aria-label': ariaLabel,
    };

    if (field === 'notes') {
      return (
        <div>
          <textarea
            {...inputProps}
            defaultValue={String(value)}
            className={`notes-textarea ${className}`}
            rows={3}
          />
          {error && <div className="text-red-500 text-xs mt-1">{error}</div>}
        </div>
      );
    }

    return (
      <div>
        <input
          {...inputProps}
          type={field === 'targetPercent' || field === 'numberOfShares' || field === 'costPerShare' ? 'number' : 'text'}
          defaultValue={formatValue()}
          className={`${field === 'ticker' ? 'ticker-input-card' : 'card-value-input'} ${className}`}
        />
        {error && <div className="text-red-500 text-xs mt-1">{error}</div>}
      </div>
    );
  }

  return (
    <span
      onClick={handleClick}
      className={`editable-field ${className}`}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClick();
        }
      }}
      aria-label={ariaLabel || `Edit ${field}`}
    >
      {formatValue()}
    </span>
  );
};
