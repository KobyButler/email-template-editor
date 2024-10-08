import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

export function exportToExcel(companyData) {
    const { name, triggers, locations, users } = companyData;
  
    // Extract edges arrays
    const usersEdges = users.edges;
    const locationsEdges = locations.edges;
  
    // Prepare data for company-level triggers
    const companyTriggersData = prepareCompanyTriggersData(triggers, usersEdges, locationsEdges);
  
    // Prepare data for location-level triggers
    const locationTriggersData = prepareLocationTriggersData(locationsEdges);
  
    // Create a new workbook and worksheets
    const wb = XLSX.utils.book_new();
  
    // Add Company-Level Triggers sheet
    const companySheet = XLSX.utils.json_to_sheet(companyTriggersData);
    XLSX.utils.book_append_sheet(wb, companySheet, 'Company Triggers');
  
    // Add Location-Level Triggers sheet
    const locationSheet = XLSX.utils.json_to_sheet(locationTriggersData);
    XLSX.utils.book_append_sheet(wb, locationSheet, 'Location Triggers');
  
    // Write the workbook and trigger a download
    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    saveAs(new Blob([wbout], { type: 'application/octet-stream' }), `${name}_Email_Triggers.xlsx`);
  }

function prepareCompanyTriggersData(triggers, usersEdges, locationsEdges) {
    // Map users and locations for quick lookup
    const userMap = {};
    usersEdges.forEach(({ node: user }) => {
        if (user && user.id) {
            userMap[user.id] = `${user.name}—${user.email}`;
        }
    });

    const locationMap = {};
    locationsEdges.forEach(({ node: location }) => {
        locationMap[location.id] = location.name;
    });

    // Process triggers
    const data = triggers
        .map((trigger, index) => {
            let triggerData;
            try {
                triggerData = typeof trigger === 'string' ? JSON.parse(trigger) : trigger;
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
                .filter(Boolean)
                .join(', ');

            // Format criteria for display
            const formattedCriteria = Object.entries(criteria || {}).map(([key, value]) => {
                // Omit "notations." prefix if present
                let displayKey = key.startsWith('notations.')
                    ? key.replace('notations.', '')
                    : key;

                // Check if the key is "location_id"
                if (key === 'location_id') {
                    const locationName = locationMap[value] || `ID ${value}`;
                    return `Location: ${locationName}`;
                }

                // Handle "user_id" key
                if (key === 'user_id') {
                    const userDetail = userMap[value];
                    if (userDetail) {
                        return `User: ${userDetail}`;
                    } else {
                        console.warn(`User ID ${value} not found in userMap`);
                        return `User: ID ${value} (INACTIVE USER ACCOUNT)`;
                    }
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
                let conditionValue;
                if (typeof value === 'object' && value !== null) {
                    const condition = Object.keys(value)[0];
                    conditionValue = value[condition];
                } else {
                    conditionValue = value;
                }

                return `${displayKey}: ${conditionValue}`;
            }).join('; ');

            return {
                'Trigger ID': index + 1,
                Criteria: formattedCriteria,
                'Email To': emailToList,
                'Email Subject': emailSubject,
            };
        })
        .filter(Boolean);

    return data;
}

function prepareLocationTriggersData(locationsEdges) {
    const data = [];

    locationsEdges.forEach(({ node: location }) => {
        const workflowBody = location.workflow?.body;
        if (!workflowBody || !workflowBody.template) {
            return;
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
                    moduleKeys = option.value.split(',').map((key) => key.trim());
                } else if (Array.isArray(option.value)) {
                    moduleKeys = option.value.map((key) => key.toString());
                } else if (option.value !== null && option.value !== undefined) {
                    moduleKeys = [option.value.toString()];
                } else {
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

        // Build an array of email modules with emails and their associated workflows
        const emailModulesWithEmailsAndWorkflows = emailModules
            .map((emailModule) => {
                const includeBcc = emailModule.email?.include_bcc || '';
                const sendToTextDefault = emailModule.email?.send_to_text_default || '';

                // Split and clean emails
                const emails = [...includeBcc.split(','), ...sendToTextDefault.split(',')]
                    .map((email) => email.trim())
                    .filter(Boolean);

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
            emailModulesWithEmailsAndWorkflows.forEach(({ emailModule, emails, associatedWorkflows }) => {
                data.push({
                    Location: location.name,
                    'Module Key': emailModule.key,
                    Emails: emails.join(', '),
                    'Associated Workflows': associatedWorkflows.join(', '),
                });
            });
        }
    });

    return data;
}