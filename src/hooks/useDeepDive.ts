import { useState, useCallback } from 'react';
import { handleApiError } from '../utils/errorHandler';
import { apiClient } from '../services/apiClient';

export const useDeepDive = () => {
  const [deepDiveTicker, setDeepDiveTicker] = useState('');
  const [isDeepDiveModalOpen, setIsDeepDiveModalOpen] = useState(false);
  const [deepDiveReport, setDeepDiveReport] = useState('');
  const [isDeepDiveLoading, setIsDeepDiveLoading] = useState(false);

  const generateDeepDiveReport = useCallback(async (ticker: string) => {
    if (!ticker) return;
    
    setIsDeepDiveLoading(true);
    setDeepDiveReport('');
    setDeepDiveTicker(ticker);
    setIsDeepDiveModalOpen(true);

    try {
      const response = await apiClient.generateDeepDiveReport(ticker);
      setDeepDiveReport(response.report);
    } catch (error) {
      console.error('Deep Dive Generation Error:', error);
      const friendlyMessage = handleApiError(error);
      setDeepDiveReport(friendlyMessage);
    } finally {
      setIsDeepDiveLoading(false);
    }
  }, []);

  const closeDeepDiveModal = useCallback(() => {
    setIsDeepDiveModalOpen(false);
    setDeepDiveReport('');
    setDeepDiveTicker('');
  }, []);

  return {
    deepDiveTicker,
    isDeepDiveModalOpen,
    deepDiveReport,
    isDeepDiveLoading,
    generateDeepDiveReport,
    closeDeepDiveModal,
  };
};
