import React, { useState, useEffect, useMemo } from 'react';
import TriggerDisplay from './components/TriggerDisplay';
import Login from './components/Login';
import debounce from 'lodash.debounce';
import './App.css';

function App() {
  const [inputValue, setInputValue] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [companySuggestions, setCompanySuggestions] = useState([]);
  // eslint-disable-next-line no-unused-vars
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [triggerData, setTriggerData] = useState(null);
  const [apiToken, setApiToken] = useState(localStorage.getItem('apiToken') || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch company suggestions as the user types
  useEffect(() => {
    const fetchCompanies = async () => {
      if (companyName.trim() === '') {
        setCompanySuggestions([]);
        return;
      }

      const query = `
      {
        companies(first: 20, name: "${companyName}") {
          edges {
            node {
              name
            }
          }
        }
      }
    `;

      try {
        const response = await fetch('https://api.record360.com/v2', {
          method: 'POST',
          headers: {
            Authorization: 'Bearer ' + apiToken,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ query }),
        });

        const data = await response.json();
        const companies = data.data.companies.edges.map((edge) => edge.node.name);
        setCompanySuggestions(companies);
      } catch (error) {
        console.error('Error fetching companies:', error);
      }
    };

    if (apiToken) {
      fetchCompanies();
    }
  }, [companyName, apiToken]);

  const fetchTriggerData = async (companyName) => {
    setLoading(true);
    setError(null);

    const query = `
      {
        companies(first: 1, name: "${companyName}") {
          edges {
            node {
              id
              name
              triggers
              locations {
                edges {
                  node {
                    id
                    name
                    demo
                    active
                    workflow {
                      body
                    }
                  }
                }
              }
            }
          }
        }
      }
    `;

    try {
      const response = await fetch('https://api.record360.com/v2', {
        method: 'POST',
        headers: {
          Authorization: 'Bearer ' + apiToken,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query }),
      });

      const data = await response.json();
      const companyData = data.data.companies.edges[0]?.node;

      if (companyData) {
        setTriggerData(companyData);
      } else {
        setTriggerData(null);
        setError('Company not found.');
      }
    } catch (error) {
      console.error('Error fetching trigger data:', error);
      setError('Error fetching trigger data.');
    } finally {
      setLoading(false);
    }
  };

  const debouncedFetchCompanies = useMemo(() => {
    const debounced = debounce((value) => {
      setCompanyName(value);
    }, 300);

    return debounced;
  }, []);

  useEffect(() => {
    return () => {
      // Cleanup the debounced function on unmount
      debouncedFetchCompanies.cancel();
    };
  }, [debouncedFetchCompanies]);

  // Handle login
  const handleLogin = (token) => {
    setApiToken(token);
    localStorage.setItem('apiToken', token);
  };

  if (!apiToken) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="app-container">
      <h1>Email Trigger Editor</h1>
      <div className="search-container">
        <input
          type="text"
          placeholder="Enter Company Name"
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value);
            debouncedFetchCompanies(e.target.value);
          }}
        />
        {companySuggestions.length > 0 && (
          <ul className="suggestions-list">
            {companySuggestions.map((name) => (
              <li
                key={name}
                onClick={() => {
                  setSelectedCompany(name);
                  setCompanyName(name);
                  setInputValue(name);
                  setCompanySuggestions([]);
                  fetchTriggerData(name);
                }}
              >
                {name}
              </li>
            ))}
          </ul>
        )}
      </div>

      <button
        onClick={() => {
          setApiToken('');
          localStorage.removeItem('apiToken');
          setCompanyName('');
          setInputValue('');
          setCompanySuggestions([]);
          setSelectedCompany(null);
          setTriggerData(null);
        }}
      >
        Logout
      </button>

      {loading && <p>Loading data...</p>}
      {error && <p>{error}</p>}

      {triggerData && <TriggerDisplay triggerData={triggerData} />}
    </div>
  );
}

export default App;
