import { useState, useEffect } from 'react';

export const useLocation = () => {
  const [countries, setCountries] = useState([]);
  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch all countries on mount
  useEffect(() => {
    const fetchCountries = async () => {
      setLoading(true);
      try {
        const response = await fetch('https://countriesnow.space/api/v0.1/countries/iso');
        const data = await response.json();
        if (!data.error) {
          // Sort alphabetically
          const sortedCountries = data.data.sort((a, b) => a.name.localeCompare(b.name));
          setCountries(sortedCountries);
        }
      } catch (err) {
        setError('Failed to fetch countries');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchCountries();
  }, []);

  // Fetch states for a given country name
  const fetchStates = async (countryName) => {
    if (!countryName) {
      setStates([]);
      setCities([]);
      return;
    }
    setLoading(true);
    try {
      const response = await fetch('https://countriesnow.space/api/v0.1/countries/states', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ country: countryName })
      });
      const data = await response.json();
      if (!data.error) {
        setStates(data.data.states || []);
      } else {
        setStates([]);
      }
      setCities([]); // Reset cities when state changes
    } catch (err) {
      setError('Failed to fetch states');
      console.error(err);
      setStates([]);
      setCities([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch cities for a given country and state name
  const fetchCities = async (countryName, stateName) => {
    if (!countryName || !stateName) {
      setCities([]);
      return;
    }
    setLoading(true);
    try {
      const response = await fetch('https://countriesnow.space/api/v0.1/countries/state/cities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ country: countryName, state: stateName })
      });
      const data = await response.json();
      if (!data.error) {
        setCities(data.data || []);
      } else {
        setCities([]);
      }
    } catch (err) {
      setError('Failed to fetch cities');
      console.error(err);
      setCities([]);
    } finally {
      setLoading(false);
    }
  };

  return {
    countries,
    states,
    cities,
    loading,
    error,
    fetchStates,
    fetchCities
  };
};
