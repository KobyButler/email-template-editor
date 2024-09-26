import React from 'react';
import './LocationTriggers.css';

function LocationTriggers({ locations }) {
    // Filter out inactive locations
    const demoLocations = locations.filter(({ node: location }) => location.demo === 'false');
    const activeLocations = demoLocations.filter(({ node: location }) => location.active);

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

                // Filter emailModules to include only those with emails
                const emailModulesWithEmails = emailModules.filter((emailModule) => {
                    const includeBcc = emailModule.email?.include_bcc || '';
                    const emails = includeBcc
                        .split(',')
                        .map((email) => email.trim())
                        .filter(Boolean);
                    return emails.length > 0;
                });

                if (emailModulesWithEmails.length > 0) {
                    return (
                        <div key={location.id}>
                            <h4>Location: {location.name}</h4>
                            <table className="trigger-table">
                                <thead>
                                    <tr>
                                        <th>Module Key</th>
                                        <th>Emails</th>
                                        <th>Associated Workflows</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {emailModulesWithEmails.map((emailModule) => {
                                        const includeBcc = emailModule.email?.include_bcc || '';
                                        const emails = includeBcc
                                            .split(',')
                                            .map((email) => email.trim())
                                            .filter(Boolean);
                                        const moduleName = emailModule.key;
                                        const moduleKey = emailModule.key;
                                        const associatedWorkflows = workflowsMap[moduleKey] || [];

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
                                                    {associatedWorkflows.length > 0 ? (
                                                        <ul className="workflow-list">
                                                            {associatedWorkflows.map((workflow, idx) => (
                                                                <li key={idx}>{workflow}</li>
                                                            ))}
                                                        </ul>
                                                    ) : (
                                                        'No workflows found'
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    );
                } else {
                    return null; // Don't render this location if no email modules with emails
                }
            })}
        </div>
    );
}

export default LocationTriggers;
