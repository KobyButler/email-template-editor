import React from 'react';
import './CompanyTriggers.css';

function CompanyTriggers({ triggers, locations }) {
    if (!triggers || triggers.length === 0) {
        return (
            <div>
                <h3>Company-Level Triggers</h3>
                <p>No company-level triggers found.</p>
            </div>
        );
    }

    const locationMap = {};
    locations.forEach(({ node: location }) => {
        locationMap[location.id] = location.name;
    });

    // Prepare data for the table
    const tableData = triggers
        .map((trigger, index) => {
            let triggerData;
            try {
                // Parse the trigger if it's a JSON string
                triggerData =
                    typeof trigger === 'string' ? JSON.parse(trigger) : trigger;
            } catch (error) {
                console.error('Error parsing trigger:', error);
                return null;
            }

            const { criteria, email } = triggerData;
            const emailTo = email?.to || 'No recipient specified';
            const emailSubject = email?.subject || 'No subject specified';

            // Process emailTo to create a list of emails
            const emailToList = emailTo
                .split(',')
                .map((email) => email.trim())
                .filter(Boolean);

            // Format criteria for display
            const formattedCriteria = Object.entries(criteria || {}).map(
                ([key, value]) => {
                    // Omit "notations." prefix if present
                    let displayKey = key.startsWith('notations.')
                        ? key.replace('notations.', '')
                        : key;

                    // Check if the key is "location_id"
                    if (key === 'location_id') {
                        const locationName = locationMap[value] || `ID ${value}`;
                        return `Location: ${locationName}`;
                    }

                    // Handle "check_in" key
                    if (key === 'check_in') {
                        const conditionValue = value;
                        if (conditionValue === false) {
                            return `Inspection Type: Checkout`;
                        } else if (conditionValue === true) {
                            return `Inspection Type: Return`;
                        } else if (conditionValue === null) {
                            return `Update`;
                        } else {
                            return `Unhandled`;
                        }
                    }

                    // Handle "$or" key
                    if (key === '$or' && Array.isArray(value)) {
                        const inspectionTypes = [];
                        value.forEach((conditionObj) => {
                            const subKey = Object.keys(conditionObj)[0];
                            const subValue = conditionObj[subKey];
                            if (subKey === 'check_in') {
                                if (subValue === false) {
                                    inspectionTypes.push('Checkout');
                                } else if (subValue === true) {
                                    inspectionTypes.push('Return');
                                } else if (subValue === null) {
                                    inspectionTypes.push('Update');
                                } else {
                                    inspectionTypes.push('Unhandled');
                                }
                            }
                        });
                        return `Inspection Type: ${inspectionTypes.join(', ')}`;
                    }

                    // Default handling
                    const condition = Object.keys(value)[0];
                    const conditionValue = value[condition] || value;
                    return `${displayKey}: ${conditionValue}`;
                }
            );

            return {
                id: index + 1,
                criteria: formattedCriteria,
                emailToList,
                emailSubject,
            };
        })
        .filter(Boolean); // Remove any null entries due to parsing errors

    return (
        <div>
            <h3>Company-Level Triggers</h3>
            <div className="table-container">
                <table className="company-trigger-table">
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>Criteria</th>
                            <th>Email To</th>
                            <th>Email Subject</th>
                        </tr>
                    </thead>
                    <tbody>
                        {tableData.map((trigger) => (
                            <tr key={trigger.id}>
                                <td>{trigger.id}</td>
                                <td>
                                    <ul className="criteria-list">
                                        {trigger.criteria.map((criterion, idx) => (
                                            <li key={idx}>{criterion}</li>
                                        ))}
                                    </ul>
                                </td>
                                <td>
                                    {trigger.emailToList.map((email, idx) => (
                                        <span key={idx}>
                                            {email}
                                            {idx < trigger.emailToList.length - 1 && ', '}
                                        </span>
                                    ))}
                                </td>
                                <td>{trigger.emailSubject}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default CompanyTriggers;
