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
    setTriggerData(null); // Reset triggerData

    try {
      // Step 1: Fetch company data without users
      const companyQuery = `
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

      const companyResponse = await fetch('https://api.record360.com/v2', {
        method: 'POST',
        headers: {
          Authorization: 'Bearer ' + apiToken,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: companyQuery }),
      });

      const companyDataJson = await companyResponse.json();
      const companyData = companyDataJson.data.companies.edges[0]?.node;

      if (!companyData) {
        setTriggerData(null);
        setError('Company not found.');
        setLoading(false);
        return;
      }

      // Step 2: Fetch all users with pagination
      let allUsers = [];
      let hasNextPage = true;
      let afterCursor = null;

      while (hasNextPage) {
        const usersQuery = `
          {
            companies(first: 1, name: "${companyName}") {
              edges {
                node {
                  users(first: 100, ${afterCursor ? `after: "${afterCursor}"` : ''}) {
                    edges {
                      cursor
                      node {
                        id
                        name
                        email
                      }
                    }
                    pageInfo {
                      endCursor
                      hasNextPage
                    }
                  }
                }
              }
            }
          }
        `;

        const usersResponse = await fetch('https://api.record360.com/v2', {
          method: 'POST',
          headers: {
            Authorization: 'Bearer ' + apiToken,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ query: usersQuery }),
        });

        const usersDataJson = await usersResponse.json();
        const usersData = usersDataJson.data.companies.edges[0]?.node.users;

        if (usersData) {
          allUsers = allUsers.concat(usersData.edges);
          console.log(`Total users fetched: ${allUsers.length}`);

          hasNextPage = usersData.pageInfo.hasNextPage;
          afterCursor = usersData.pageInfo.endCursor;
        } else {
          hasNextPage = false;
        }
      }

      // Step 3: Update companyData with all users
      companyData.users = { edges: allUsers };

      // Step 4: Set triggerData and loading state
      setTriggerData(companyData);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching trigger data:', error);
      setError('Error fetching trigger data.');
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
      <h1>Email Triggers</h1>
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
                  setTriggerData(null);
                  fetchTriggerData(name);
                }}
              >
                {name}
              </li>
            ))}
          </ul>
        )}
      </div>

      <button className='logout-button'
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
