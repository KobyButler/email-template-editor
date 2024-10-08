// src/components/TriggerDisplay.js
import React from 'react';
import CompanyTriggers from './CompanyTriggers';
import LocationTriggers from './LocationTriggers';

function TriggerDisplay({ triggerData }) {
    const company = triggerData;

    if (!company) {
        return <p>No data available for the selected company.</p>;
    }

    return (
        <div>
            <h2>Company: {company.name}</h2>
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
