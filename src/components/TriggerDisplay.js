import React from 'react';
import CompanyTriggers from './CompanyTriggers';
import LocationTriggers from './LocationTriggers';
import { exportToExcel } from '../utils/exportToExcel';
import './TriggerDisplay.css';

function TriggerDisplay({ triggerData }) {
    const company = triggerData;

    if (!company) {
        return <p>No data available for the selected company.</p>;
    }

    return (
        <div className="trigger-display">
            <h2>Company: {company.name}</h2>
            <button className="export-button" onClick={() => exportToExcel(company)}>
                Export to Excel
            </button>
            <CompanyTriggers
                triggers={company.triggers}
                locations={company.locations.edges}
                users={company.users.edges}
            />
            <LocationTriggers locations={company.locations.edges} />
        </div>
    );
}

export default TriggerDisplay;
