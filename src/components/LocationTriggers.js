import React from 'react';

function LocationTriggers({ locations }) {
    return (
        <div>
            <h3>Location-Level Triggers</h3>
            {locations.map(({ node: location }) => {
                const workflowBody = location.workflow?.body;
                if (!workflowBody || !workflowBody.template) {
                    return null;
                }

                const modules = workflowBody.template.modules || [];
                const logicBranches = modules.filter((module) => module.logic_branch);
                console.log(logicBranches);
                const emailModules = modules.filter((module) => module.key && module.key.startsWith('E'));
                console.log(emailModules);
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
                            console.warn('Skipping option with null or undefined value:', option);
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

                return (
                    <div key={location.id}>
                        <h4>Location: {location.name}</h4>
                        {emailModules.map((emailModule) => {
                            console.log(emailModule.email.include_bcc);
                            const includeBcc = emailModule.email.include_bcc || '';
                            const emails = includeBcc.split(',').map((email) => email.trim()).filter(Boolean);
                            const moduleName = emailModule.name;
                            const moduleKey = emailModule.key;
                            const associatedWorkflows = workflowsMap[moduleKey] || [];

                            return (
                                <div key={moduleKey} className="email-module">
                                    <h5>Module: {moduleKey} - {moduleName}</h5>
                                    <p><strong>Emails:</strong></p>
                                    {emails.length > 0 ? (
                                        <ul>
                                            {emails.map((email, idx) => (
                                                <li key={idx}>{email}</li>
                                            ))}
                                        </ul>
                                    ) : (
                                        <p>No emails found.</p>
                                    )}
                                    <p><strong>Associated Workflows:</strong></p>
                                    {associatedWorkflows.length > 0 ? (
                                        <ul>
                                            {associatedWorkflows.map((workflowName, idx) => (
                                                <li key={idx}>{workflowName}</li>
                                            ))}
                                        </ul>
                                    ) : (
                                        <p>No associated workflows found for this module.</p>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                );
            })}
        </div>
    );
}

export default LocationTriggers;
