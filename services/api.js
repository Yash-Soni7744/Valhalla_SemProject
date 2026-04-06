/**
 * THE CRM ENGINE (API SERVICE)
 * 
 * Purpose: This file acts as the "Brain" of your software. 
 * Since we don't have a backend server (like Node.js or Python), 
 * we use the browser's 'localStorage' to save all your data.
 * 
 * How to explain this in your Evaluation:
 * 1. "Local Persistence": Data stays saved even if you close the browser.
 * 2. "JSON Storage": We save data as text and convert it back to objects using JSON.parse().
 * 3. "Mock Delays": We added small delays (0.5s) to make the website feel like it's talking to a real server.
 */

// Helper: Makes the app wait. Used to show off your loading spinners!
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Helper: Get data from the browser's hidden vault (localStorage)
const getStorage = (key) => {
    if (typeof window === 'undefined') return []; // Safety check for Next.js
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : []; // Convert text back to JS list
};

// Helper: Save data into the vault
const setStorage = (key, data) => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(key, JSON.stringify(data)); // Convert JS list to text
};

/**
 * DATABASE INITIALIZATION (SEEDING)
 * When you first open the app, it's empty. This creates a default Admin account.
 * Credentials: admin@miestilo.com / admin
 */
const initializeDatabase = () => {
    let users = getStorage('users');
    let leads = getStorage('leads');
    
    // Seed Users if not populated
    if (users.length === 0) {
        users = [
            { id: 'admin_001', name: 'Master Admin', email: 'admin@miestilo.com', password: 'admin', role: 'admin', employee_id: 'MIS000', created_at: new Date().toISOString() },
            { id: 'user_002', name: 'John Doe', email: 'john@miestilo.com', password: 'password', role: 'employee', employee_id: 'MIS001', created_at: new Date().toISOString() },
            { id: 'user_003', name: 'Sarah Smith', email: 'sarah@miestilo.com', password: 'password', role: 'employee', employee_id: 'MIS002', created_at: new Date().toISOString() },
            { id: 'user_004', name: 'Mike Johnson', email: 'mike@miestilo.com', password: 'password', role: 'employee', employee_id: 'MIS003', created_at: new Date().toISOString() }
        ];
        setStorage('users', users);
    } else {
        // MIGRATION: Ensure all existing users have an employee_id
        let changed = false;
        users.forEach((u, index) => {
            if (!u.employee_id) {
                u.employee_id = 'MIS' + String(index).padStart(3, '0');
                changed = true;
            }
        });
        if (changed) setStorage('users', users);
    }

    // Seed Leads if empty
    if (leads.length === 0) {
        const dummyLeads = [
            { id: 'lead_001', company_name: 'Tech Corp', contact_person: 'Alice Brown', phone: '1234567890', email: 'alice@techcorp.com', status: 'New', assigned_to: 'user_002', expected_price: 5000, lead_source: 'Website', created_at: new Date().toISOString() },
            { id: 'lead_002', company_name: 'Design Pro', contact_person: 'Bob White', phone: '9876543210', email: 'bob@designpro.com', status: 'In Progress', assigned_to: 'user_003', expected_price: 3200, lead_source: 'Referral', created_at: new Date().toISOString() },
            { id: 'lead_003', company_name: 'Marketing Plus', contact_person: 'Charlie Green', phone: '5551234567', email: 'charlie@marketingplus.com', status: 'Follow Up', assigned_to: 'user_004', expected_price: 8000, lead_source: 'Social Media', created_at: new Date().toISOString() },
            { id: 'lead_004', company_name: 'Retail giants', contact_person: 'Diana Prince', phone: '9000100010', email: 'diana@retailg.com', status: 'New', assigned_to: 'user_002', expected_price: 15000, lead_source: 'Direct Mail', created_at: new Date().toISOString() },
            { id: 'lead_005', company_name: 'Foodies Ltd', contact_person: 'Eve Adams', phone: '9888777666', email: 'eve@foodies.com', status: 'Converted', assigned_to: 'user_003', expected_price: 2500, lead_source: 'Website', created_at: new Date().toISOString() },
            { id: 'lead_006', company_name: 'Auto Motors', contact_person: 'Frank Castle', phone: '2223334444', email: 'frank@automotors.com', status: 'Lost', assigned_to: 'user_004', expected_price: 10000, lead_source: 'Trade Show', created_at: new Date().toISOString() },
            { id: 'lead_007', company_name: 'Edu World', contact_person: 'George King', phone: '8005551212', email: 'george@eduworld.com', status: 'In Progress', assigned_to: 'admin_001', expected_price: 6000, lead_source: 'Referral', created_at: new Date().toISOString() },
            { id: 'lead_008', company_name: 'FinTech Solutions', contact_person: 'Helen Troy', phone: '4005006000', email: 'helen@fintech.com', status: 'Follow Up', assigned_to: 'user_002', expected_price: 12000, lead_source: 'Website', created_at: new Date().toISOString() }
        ];
        setStorage('leads', dummyLeads);

        // Add the converted lead to customers automatically
        const customers = getStorage('customers');
        setStorage('customers', [...customers, { id: 'lead_005', company_name: 'Foodies Ltd', total_orders: 1, total_order_value: 2500, created_at: new Date().toISOString() }]);
    }
};

// Run the initialization immediately
if (typeof window !== 'undefined') initializeDatabase();

// ==========================================
// 1. USER & EMPLOYEE MANAGEMENT
// ==========================================

export const getUsers = async () => {
    await delay(400); 
    return getStorage('users');
};

export const createUser = async (user) => {
    await delay(500);
    const users = getStorage('users');
    
    // Automatic Employee ID generation (e.g. MIS003)
    // We count existing users and add 1 to get the next number
    const nextNumber = users.length;
    const generatedEmployeeId = 'MIS' + String(nextNumber).padStart(3, '0');

    const newUser = {
        ...user,
        id: 'user_' + Math.random().toString(36).substr(2, 5),
        employee_id: user.employee_id || generatedEmployeeId, // Use provided or generate new
        created_at: new Date().toISOString()
    };
    setStorage('users', [...users, newUser]);
    return newUser;
};

export const deleteUser = async (id) => {
    await delay(300);
    const users = getStorage('users');
    setStorage('users', users.filter(u => u.id !== id));
};

export const updateUser = async (id, updates) => {
    await delay(400);
    const users = getStorage('users');
    const index = users.findIndex(u => u.id === id);
    if (index === -1) return null;
    
    users[index] = { ...users[index], ...updates };
    setStorage('users', users);
    return users[index];
};


// ==========================================
// 2. LEAD MANAGEMENT (The Core CRM Logic)
// ==========================================

// Fetches all sales leads and attaches the name of the staff member assigned to them
export const getLeads = async () => {
    await delay(600);
    const leads = getStorage('leads');
    const users = getStorage('users');

    return leads.map(lead => {
        const staff = users.find(u => u.id === lead.assigned_to);
        return { 
            ...lead, 
            assigned_to_name: staff ? staff.name : 'Unassigned' 
        };
    }).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
};

export const getLead = async (id) => {
    const leads = getStorage('leads');
    return leads.find(l => l.id === id);
};

export const createLead = async (leadData) => {
    await delay(500);
    const leads = getStorage('leads');
    const newLead = {
        ...leadData,
        id: 'lead_' + Math.random().toString(36).substr(2, 5),
        created_at: new Date().toISOString(),
        status: leadData.status || 'New'
    };
    setStorage('leads', [...leads, newLead]);
    return newLead;
};

// Bulk Import logic (for Excel/CSV uploads)
export const createLeads = async (multipleLeads) => {
    await delay(1200);
    const currentLeads = getStorage('leads');
    const formatted = multipleLeads.map(l => ({
        ...l,
        id: 'lead_' + Math.random().toString(36).substr(2, 5),
        created_at: new Date().toISOString(),
        status: 'New'
    }));
    setStorage('leads', [...currentLeads, ...formatted]);
    return formatted.length;
};

// Update a lead. IMPORTANT: If status becomes 'Converted', they move to Customers!
export const updateLead = async (id, updates) => {
    await delay(400);
    const leads = getStorage('leads');
    const index = leads.findIndex(l => l.id === id);
    if (index === -1) return null;

    const oldStatus = leads[index].status;
    const updatedLead = { ...leads[index], ...updates };
    leads[index] = updatedLead;
    setStorage('leads', leads);

    // CRM LOGIC: Converted Lead -> Paying Customer
    if (updates.status === 'Converted' && oldStatus !== 'Converted') {
        const customers = getStorage('customers');
        const newCust = {
            id: id,
            company_name: updatedLead.company_name,
            total_orders: 1,
            total_order_value: updatedLead.expected_price || 0,
            created_at: new Date().toISOString()
        };
        setStorage('customers', [...customers, newCust]);
    }
    return updatedLead;
};

export const deleteLead = async (id) => {
    const leads = getStorage('leads');
    setStorage('leads', leads.filter(l => l.id !== id));
};

export const deleteLeadWithLog = async (id, employeeId) => {
    const leads = getStorage('leads');
    const lead = leads.find(l => l.id === id);
    if (!lead) return;

    const users = getStorage('users');
    const staff = users.find(u => u.id === employeeId);

    await createActivity({
        type: 'Lead Deleted',
        employee_name: staff ? staff.name : 'Unknown',
        employee_id: staff ? staff.employee_id : '---',
        company_name: lead.company_name,
        contact_person: lead.contact_person,
        contact_no: lead.phone,
        lead_id: id,
        notes: `Permanently removed lead from system`
    });

    setStorage('leads', leads.filter(l => l.id !== id));
};


// ==========================================
// 3. REMINDERS & FOLLOW-UPS
// ==========================================

export const getFollowUps = async () => {
    await delay(400);
    const reminders = getStorage('follow_ups');
    const leads = getStorage('leads');

    return reminders.map(r => ({
        ...r,
        leads: leads.find(l => l.id === r.lead_id)
    })).sort((a,b) => new Date(a.follow_up_date) - new Date(b.follow_up_date));
};

export const createFollowUp = async (data) => {
    const reminders = getStorage('follow_ups');
    const newR = { ...data, id: 'rem_' + Math.random().toString(36).substr(2, 5) };
    setStorage('follow_ups', [...reminders, newR]);
    return newR;
};

export const deleteFollowUp = async (id) => {
    const reminders = getStorage('follow_ups');
    setStorage('follow_ups', reminders.filter(r => r.id !== id));
};


// ==========================================
// 4. CUSTOMER DATABASE
// ==========================================

export const getCustomers = async () => {
    await delay(400);
    return getStorage('customers');
};

export const deleteCustomer = async (id) => {
    const customers = getStorage('customers');
    setStorage('customers', customers.filter(c => c.id !== id));
};

// ==========================================
// 5. LOGIN LOGIC (Simulated)
// ==========================================

export const loginUserMock = async (email, pass) => {
    await delay(1000);
    const users = getStorage('users');
    const found = users.find(u => u.email === email && u.password === pass);
    return found ? { data: found } : { error: 'Invalid Login' };
};

export const loginEmployeeMock = async (email, pass) => {
    await delay(1000);
    if (!email.endsWith('@miestilo.com')) return { error: 'Please use workplace email (@miestilo.com)' };
    const users = getStorage('users');
    const found = users.find(u => u.email === email && u.password === pass);
    return found ? { data: found } : { error: 'Staff account not found.' };
};

// ==========================================
// 6. ACTIVITY LOG (The Auditor)
// ==========================================

/**
 * Purpose: This tracks who did what. Whenever you update a lead, 
 * a "Log" entry is created so the Boss can see who changed the status.
 */
const syncActivities = async () => {
    const leads = getStorage('leads');
    const activities = getStorage('activities');
    const users = getStorage('users');

    let changed = false;
    leads.forEach(lead => {
        // Check if this lead already has a "Creation" log
        const hasLog = activities.some(a => a.lead_id === lead.id && a.type === 'New Lead');
        if (!hasLog) {
            const staff = users.find(u => u.id === lead.assigned_to) || users[0];
            const newLog = {
                id: Math.random().toString(36).substr(2, 9),
                type: 'New Lead',
                employee_name: staff ? staff.name : 'Unknown',
                employee_id: staff ? staff.employee_id : '---',
                date: new Date(lead.created_at || Date.now()).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
                timestamp: new Date(lead.created_at || Date.now()).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }),
                company_name: lead.company_name,
                contact_person: lead.contact_person,
                contact_no: lead.phone,
                lead_source: lead.lead_source || 'Direct',
                lead_id: lead.id,
                is_owner: true,
                notes: `System generated: Lead created and assigned to ${staff ? staff.name : 'Unknown'}.`
            };
            activities.push(newLog);
            changed = true;
        }
    });

    if (changed) setStorage('activities', activities);
};

export const getActivities = async () => {
    await delay(500);
    await syncActivities(); // Ensure every lead has at least one log
    return getStorage('activities');
};

export const createActivity = async (action) => {
    const logs = getStorage('activities');
    const newLog = {
        ...action,
        id: Math.random().toString(36).substr(2, 9),
        date: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
        timestamp: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }),
    };
    logs.push(newLog);
    setStorage('activities', logs);
    return newLog;
};


export const updateActivity = async (id, updates) => {
    await delay(300);
    const logs = getStorage('activities');
    const index = logs.findIndex(l => l.id === id);
    if (index === -1) return null;
    
    logs[index] = { ...logs[index], ...updates };
    setStorage('activities', logs);
    return logs[index];
};


// Function used by pages to "Update a Lead + Create a Log entry" in one go
export const updateLeadWithLog = async (leadId, updates, employeeId) => {
    const updated = await updateLead(leadId, updates);
    const users = getStorage('users');
    const staff = users.find(u => u.id === employeeId);

    // Create the Audit Log
    await createActivity({
        type: updates.status ? 'Status Update' : 'Profile Edit',
        employee_name: staff ? staff.name : 'Unknown',
        employee_id: staff ? staff.employee_id : '---',
        company_name: updated.company_name,
        contact_person: updated.contact_person,
        contact_no: updated.phone,
        lead_id: leadId,
        notes: updates.status ? `Moved lead to stage: ${updates.status}` : 'Updated contact details'
    });

    return updated;
};

export const createLeadWithLog = async (leadData, employeeId) => {
    const newLead = await createLead(leadData);
    const users = getStorage('users');
    const staff = users.find(u => u.id === employeeId);

    await createActivity({
        type: 'New Lead',
        employee_name: staff ? staff.name : 'Unknown',
        employee_id: staff ? staff.employee_id : '---',
        company_name: newLead.company_name,
        contact_person: newLead.contact_person,
        contact_no: newLead.phone,
        lead_id: newLead.id,
        notes: `Created new lead entry`
    });

    return newLead;
};


// Statistics for the 4 big cards on the Home Dashboard
export const getDashboardStats = async () => {
    await delay(500);
    const leads = getStorage('leads');
    const customers = getStorage('customers');
    const followUps = getStorage('follow_ups');
    const today = new Date().toISOString().split('T')[0];

    return {
        totalLeads: leads.length,
        newLeads: leads.filter(l => l.status === 'New').length,
        convertedCustomers: customers.length,
        followUpsToday: followUps.filter(f => f.follow_up_date === today).length
    };
};

export const bulkAssignLeads = async (leadIds, employeeId) => {
    await delay(800);
    const leads = getStorage('leads');
    const users = getStorage('users');
    const staff = users.find(u => u.id === employeeId);

    const updatedLeads = leads.map(lead => {
        if (leadIds.includes(lead.id)) {
            return { ...lead, assigned_to: employeeId };
        }
        return lead;
    });

    setStorage('leads', updatedLeads);

    // Also log this bulk action
    await createActivity({
        type: 'Bulk Assignment',
        employee_name: 'Admin System',
        employee_id: 'SYSTEM',
        company_name: 'Multiple',
        contact_person: `${leadIds.length} Leads`,
        contact_no: '---',
        notes: `Assigned ${leadIds.length} leads to ${staff ? staff.name : 'Unknown'}`
    });
};


