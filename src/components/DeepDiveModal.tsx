import React from 'react';
import { textToSafeHtml } from '../utils/htmlSanitizer';

interface DeepDiveModalProps {
  isOpen: boolean;
  onClose: () => void;
  ticker: string;
  report: string;
  isLoading: boolean;
}

export const DeepDiveModal: React.FC<DeepDiveModalProps> = ({
  isOpen,
  onClose,
  ticker,
  report,
  isLoading,
}) => {
  if (!isOpen) return null;

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="modal-overlay"
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="deep-dive-title"
    >
      <div className="deep-dive-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="deep-dive-modal-header">
          <h2 id="deep-dive-title" className="text-xl font-bold">
            Deep Dive: {ticker}
          </h2>
          <button
            onClick={onClose}
            className="text-2xl font-bold"
            aria-label="Close deep dive modal"
          >
            &times;
          </button>
        </div>
        
        <div className="deep-dive-report-content">
          {isLoading && !report ? (
            <div className="spinner-container">
              <div className="spinner" aria-hidden="true"></div>
              <p className="mt-4 text-subtle">Generating Report...</p>
            </div>
          ) : (
            <div
              dangerouslySetInnerHTML={{
                __html: textToSafeHtml(report),
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
};
