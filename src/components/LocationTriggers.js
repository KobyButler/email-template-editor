// src/components/LocationTriggers.js
import React from 'react';
import './LocationTriggers.css';

function LocationTriggers({ locations }) {
    // Filter out demo locations and inactive locations
    const nonDemoLocations = locations.filter(({ node: location }) => location.demo !== 'true'); // Adjust based on your data type
    const activeLocations = nonDemoLocations.filter(({ node: location }) => location.active);

    // If no active locations, display a message
    if (activeLocations.length === 0) {
        return (
            <div>
                <h3>Location-Level Triggers</h3>
                <p>No active locations with triggers found.</p>
            </div>
        );
    }

    return (
        <div>
            <h3>Location-Level Triggers</h3>
            {activeLocations.map(({ node: location }) => {
                const workflowBody = location.workflow?.body;
                if (!workflowBody || !workflowBody.template) {
                    return null;
                }

                const modules = workflowBody.template.modules || [];
                const logicBranches = modules.filter((module) => module.logic_branch);
                const emailModules = modules.filter(
                    (module) => module.key && module.key.startsWith('E')
                );

                // Build a mapping from module keys to workflow names
                const workflowsMap = {};
                logicBranches.forEach((logicModule) => {
                    const options = logicModule.logic_branch.options || [];
                    options.forEach((option) => {
                        let moduleKeys = [];

                        if (typeof option.value === 'string') {
                            // If option.value is a string, split it into module keys
                            moduleKeys = option.value.split(',').map((key) => key.trim());
                        } else if (Array.isArray(option.value)) {
                            // If option.value is an array, use it directly
                            moduleKeys = option.value.map((key) => key.toString());
                        } else if (option.value !== null && option.value !== undefined) {
                            // If option.value is a boolean or number, convert it to a string
                            moduleKeys = [option.value.toString()];
                        } else {
                            // option.value is null or undefined, skip processing
                            console.warn(
                                'Skipping option with null or undefined value:',
                                option
                            );
                            return;
                        }

                        moduleKeys.forEach((key) => {
                            if (!workflowsMap[key]) {
                                workflowsMap[key] = [];
                            }
                            workflowsMap[key].push(option.label);
                        });
                    });
                });

                // Build an array of email modules with emails and their combined emails
                const emailModulesWithEmailsAndWorkflows = emailModules
                    .map((emailModule) => {
                        const includeBcc = emailModule.email?.include_bcc || '';
                        const sendToTextDefault = emailModule.email?.send_to_text_default || '';

                        // Split and clean emails from includeBcc
                        const includeBccEmails = includeBcc
                            .split(',')
                            .map((email) => email.trim())
                            .filter(Boolean);

                        // Split and clean emails from sendToTextDefault
                        const sendToTextDefaultEmails = sendToTextDefault
                            .split(',')
                            .map((email) => email.trim())
                            .filter(Boolean);

                        // Combine both email arrays
                        const emails = [...includeBccEmails, ...sendToTextDefaultEmails];

                        // Get associated workflows
                        const moduleKey = emailModule.key;
                        const associatedWorkflows = workflowsMap[moduleKey] || [];

                        // Only include if there are emails and associated workflows
                        if (emails.length > 0 && associatedWorkflows.length > 0) {
                            return { emailModule, emails, associatedWorkflows };
                        } else {
                            return null;
                        }
                    })
                    .filter(Boolean); // Remove any null entries

                if (emailModulesWithEmailsAndWorkflows.length > 0) {
                    return (
                        <div key={location.id}>
                            <h4>Location: {location.name}</h4>
                            <div className="table-container">
                                <table className="trigger-table">
                                    <thead>
                                        <tr>
                                            <th>Module Key</th>
                                            <th>Emails</th>
                                            <th>Associated Workflows</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {emailModulesWithEmailsAndWorkflows.map(({ emailModule, emails, associatedWorkflows }) => {
                                            const moduleName = emailModule.key;
                                            const moduleKey = emailModule.key;

                                            return (
                                                <tr key={moduleKey}>
                                                    <td>{moduleName}</td>
                                                    <td>
                                                        {emails.map((email, idx) => (
                                                            <span key={idx}>
                                                                {email}
                                                                {idx < emails.length - 1 && ', '}
                                                            </span>
                                                        ))}
                                                    </td>
                                                    <td>
                                                        <ul className="workflow-list">
                                                            {associatedWorkflows.map((workflow, idx) => (
                                                                <li key={idx}>{workflow}</li>
                                                            ))}
                                                        </ul>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    );
                } else {
                    return null; // Don't render this location if no email modules with emails and workflows
                }
            })}
        </div>
    );
}

export default LocationTriggers;
