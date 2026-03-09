import { useState, useCallback } from 'react';
import api from '../utils/api';
import { showToast } from '../utils/toast';

export const useTargets = () => {
  const [myTargets, setMyTargets] = useState([]);
  const [targetAnalytics, setTargetAnalytics] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchTargets = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/sales/targets/all');
      setMyTargets(response.data.data || []);
    } catch (error) {
      console.error('Error fetching targets:', error);
      showToast.error('Failed to load targets');
      setMyTargets([]); // Set empty array on error
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchTargetAnalytics = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/sales/targets/analytics');
      setTargetAnalytics(response.data.data || null);
      return response.data.data;
    } catch (error) {
      console.error('Error fetching target analytics:', error);
      showToast.error('Failed to load target analytics');
      setTargetAnalytics(null);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    myTargets,
    targetAnalytics,
    isLoading,
    fetchTargets,
    fetchTargetAnalytics
  };
};
