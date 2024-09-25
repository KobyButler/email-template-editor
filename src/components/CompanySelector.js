// src/components/CompanySelector.js
import React, { useEffect } from 'react';
import { useQuery } from '@apollo/client';
import { GET_COMPANY_NAMES } from '../queries';

function CompanySelector({ onSelectCompany }) {
    const { loading, error, data } = useQuery(GET_COMPANY_NAMES);

    useEffect(() => {
        if (error) {
            console.error('Error fetching companies:', error);
        }
    }, [error]);

    if (loading) return <p>Loading companies...</p>;
    if (error) return <p>Error loading companies.</p>;

    const companies = data.companies.edges.map((edge) => edge.node);

    return (
        <div className="company-selector">
            <label htmlFor="company-select">Select Company:</label>
            <select id="company-select" onChange={(e) => onSelectCompany(e.target.value)}>
                <option value="">-- Choose a company --</option>
                {companies.map((company) => (
                    <option key={company.id} value={company.id}>
                        {company.name}
                    </option>
                ))}
            </select>
        </div>
    );
}

export default CompanySelector;