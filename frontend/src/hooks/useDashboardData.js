import { useState, useEffect } from 'react';

export const useWeather = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setTimeout(() => {
      setData({ temp: '30°C', location: 'Chennai, TN' });
      setLoading(false);
    }, 500);
  }, []);

  return { data, loading, error: null };
};

export const useCropData = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setTimeout(() => {
      setData({ name: 'Samba Rice', stage: 'Day 45 / 120' });
      setLoading(false);
    }, 600);
  }, []);

  return { data, loading, error: null };
};

export const useMarketPrices = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setTimeout(() => {
      setData({ price: '₹2,400/q', trend: '+5.0% today' });
      setLoading(false);
    }, 700);
  }, []);

  return { data, loading, error: null };
};

export const useFarmHealth = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setTimeout(() => {
      setData({ score: '94%', status: 'Excellent condition' });
      setLoading(false);
    }, 800);
  }, []);

  return { data, loading, error: null };
};
