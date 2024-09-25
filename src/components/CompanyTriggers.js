// src/components/CompanyTriggers.js
import React from 'react';

function CompanyTriggers({ triggers }) {
  if (!triggers || triggers.length === 0) {
    return (
      <div>
        <h3>Company-Level Triggers</h3>
        <p>No company-level triggers found.</p>
      </div>
    );
  }

  return (
    <div>
      <h3>Company-Level Triggers</h3>
      {triggers.map((trigger, index) => {
        let triggerData;
        try {
          // Parse the trigger if it's a JSON string
          triggerData = typeof trigger === 'string' ? JSON.parse(trigger) : trigger;
        } catch (error) {
          console.error('Error parsing trigger:', error);
          return (
            <div key={index}>
              <p>Error parsing trigger data.</p>
            </div>
          );
        }

        const { criteria, email } = triggerData;
        const emailTo = email?.to || 'No recipient specified';
        const emailSubject = email?.subject || 'No subject specified';

        // Format criteria for display
        const formattedCriteria = Object.entries(criteria || {}).map(([key, value]) => {
          const condition = Object.keys(value)[0];
          const conditionValue = value[condition];
          return `${key} ${condition} ${conditionValue}`;
        });

        return (
          <div key={index} className="email-module">
            <h4>Trigger {index + 1}</h4>
            <p><strong>Criteria:</strong></p>
            {formattedCriteria.length > 0 ? (
              <ul>
                {formattedCriteria.map((criterion, idx) => (
                  <li key={idx}>{criterion}</li>
                ))}
              </ul>
            ) : (
              <p>No criteria specified.</p>
            )}
            <p><strong>Email Details:</strong></p>
            <p><strong>To:</strong> {emailTo}</p>
            <p><strong>Subject:</strong> {emailSubject}</p>
          </div>
        );
      })}
    </div>
  );
}

export default CompanyTriggers;
