# Inventory Management System - User Manual

Welcome to the Inventory Management System! This manual is designed to help **Storeman** and **Administrator** staff understand their respective roles and master the system effectively.

---

## Table of Contents

- [Inventory Management System - User Manual](#inventory-management-system---user-manual)
  - [Table of Contents](#table-of-contents)
  - [General Navigation](#general-navigation)
  - [Storeman User Manual](#storeman-user-manual)
    - [Products Management](#products-management)
    - [Purchases \& Inbound Stock](#purchases--inbound-stock)
    - [Inventory \& Stock Tracking](#inventory--stock-tracking)
    - [Sales \& Outbound Stock](#sales--outbound-stock)
    - [Stock Logs \& History](#stock-logs--history)
  - [Administrator User Manual](#administrator-user-manual)
    - [User Management](#user-management)
    - [Role Management](#role-management)
    - [Permission Management](#permission-management)
    - [System Reports](#system-reports)

---

## General Navigation

Upon logging in, you will be greeted by the **Dashboard**, giving you an overview of operations relevant to your access level. The system uses a sidebar for navigation. Depending on your role, you will only see the menus you have permission to access.

- **Dashboard:** Provides a high-level overview of daily metrics.
- **Profile:** Keep your account details updated.
- **Logout:** Ensure you log out securely at the end of your shift.

---

## Storeman User Manual

As a **Storeman**, your primary responsibility is managing the physical flow of products: adding catalog items, recording inbound shipments, tracking serial numbers, and fulfilling sales.

### Products Management

The **Products** module acts as the system's catalog. Before inventory can be brought in, the product must exist here.

1. **Adding a Product:** Go to `Products -> Add New Product`. You will need to provide:
   - **Name:** The descriptive product name.
   - **Barcode:** Scanning or typing the product barcode.
   - **UoM (Unit of Measure):** Standard unit (e.g., Box, Unit, Kg).
   - **Min Stock:** The threshold that triggers low-stock alerts.
2. **Managing Categories:** Use the **Categories** menu to group items logically (e.g., Electronics, Hardware), making filtering easier.
3. **Product Status:** You can edit product details or temporarily archive products that are discontinued.

> **Tip:** A product cannot be deleted if there is existing inventory tied to it. Archiving is recommended in these cases.

### Purchases & Inbound Stock

The **Purchases** menu handles new stock arriving from suppliers.

1. **Recording a Purchase:** Create a purchase order, detailing the supplier, invoice number, and the list of items arriving.
2. **Receiving Items:** When physical items arrive, you register their serial numbers. The system tracks each item individually to ensure robust traceability.
3. **Stock 'IN' Verification:** Once processed, the stock is marked as `'available'` and logs are generated showing an "IN" action.

### Inventory & Stock Tracking

The **Current Stock** section shows you exactly what is in the warehouse.

1. **Status Visibility:** You can see items individually or in grouped views to monitor total `available` and `sold` quantities.
2. **Status Updates:** If a product is broken or misplaced, update its status (e.g., to `'damaged'`). This automatically logs a `STATUS_CHANGE` event.
3. **Archiving Inventory:** To remove a lost item from active view, simply archive it. This applies an `ADJUSTMENT` action to the stock log.

> **Important:** Accuracy in keeping status updated ensures smooth sales processing and prevents overselling.

### Sales & Outbound Stock

The **Sales** menu tracks items leaving the warehouse.

1. **Creating a Sale:** Input the customer's details or select an existing customer.
2. **Scanning Out Items:** Scan the serial numbers of the products being sold. Ensure the status of these specific serials is marked as `'available'`.
3. **Completion:** Upon successful completion, the system transitions those serial numbers to a `'sold'` status.

### Stock Logs & History

Under **Stock Logs**, every single movement is recorded permanently.

- **IN:** When items are added.
- **STATUS_CHANGE:** When an item is marked as damaged or repaired.
- **ADJUSTMENT:** Admin corrections or archival.
  Use this menu to audit discrepancies in stock counts.

---

## Administrator User Manual

As an **Administrator**, you have full access to the system. You will see every item on the sidebar. Beyond standard inventory operations, your core focus is on security, team organization, and high-level reporting.

### Full Operational Overview

You have complete back-office access to all Storeman modules:

- **Categories & Products:** Can create, update, or archive catalogs.
- **Purchases & Sales:** Can review all incoming shipments and outgoing orders.
- **Current Stock & Logs:** Can make emergency adjustments to stock that Storemen may be restricted from doing.

### User Management

Control who has access to the application via the **Manage Users** screen.

1. **Creating Users:** Provide name, email, contact details, and assign an appropriate security role.
2. **Modifying Users:** Suspend or edit users as staff turn over.
3. **Audit Visibility:** The system inherently tracks `created_by` and `updated_by` across practically every action, pinning accountability to individual user IDs.

### Role Management

Roles bundle multiple permissions into a single assignment (e.g., the 'Storeman' role).

1. Go to **Role Management** under the Admin section.
2. View existing roles and create new custom roles.
3. Assign combinations of permissions to these roles depending on staff seniority.

### Permission Management

Permissions define the exact actions a role can perform (e.g., `view_sales`, `manage_users`).

1. Navigate to **Permission Management**.
2. Avoid applying overarching permissions to users unless necessary. Ensure Storemen only get operational tools, explicitly denying them access to `manage_roles` or `manage_permissions`.

> **Warning:** Do not carelessly modify Administrator permission scopes. Removing critical permissions from the Admin role can permanently lock you out of system settings.

### System Reports

Data analysis across the entire warehouse pipeline.

1. Go to **Reports**.
2. **Sales Report:** Analyze revenue grouped by specific timeframes.
3. **Top Products:** Identify high-volume products to optimize future purchases and adjust `min_stock` counts.

---

## Practical Training Exercises

To ensure new staff members are fully equipped to use the system, here are step-by-step roleplay exercises designed to train them on core features. Management should oversee the completion of these tasks using a testing or staging environment (or dummy data that can be archived later).

### Storeman Training Scenarios

**Exercise 1: Catalog Setup**

1. Navigate to **Categories**. Add a new category named "Training Electronics".
2. Navigate to **Products -> Add New Product**.
3. Create a product named "Test Wireless Mouse". Set the UoM to "Unit", assign it to "Training Electronics", and set `min_stock` to 5.

**Exercise 2: Receiving Incoming Stock**

1. Navigate to **Purchases**.
2. Record a simulated purchase order from a supplier for your "Test Wireless Mouse" indicating a quantity of 10.
3. Once the items are 'received', check the **Current Stock** page to verify there are 10 unique serial numbers listed with a status of `'available'`.

**Exercise 3: Fulfilling an Order**

1. Navigate to **Sales**.
2. Create a new sale for a walk-in customer.
3. Select the "Test Wireless Mouse" and select two specific serial numbers to mark as sold.
4. Go back to **Current Stock** and filter by "Test Wireless Mouse". Verify that the two selected serials now show a status of `'sold'` and the remaining 8 are `'available'`.

**Exercise 4: Handling Damages**

1. Navigate to **Current Stock**.
2. Find one of the remaining `'available'` "Test Wireless Mouse" serial numbers.
3. Edit its status to `'damaged'` and add a note saying "Dropped during transit".
4. Navigate to **Stock Logs** and locate the exact `STATUS_CHANGE` entry proving accountability.

### Administrator Training Scenarios

**Exercise 1: Custom Role Creation**

1. Navigate to **Role Management** under the Admin menu.
2. Create a new role titled "Junior Storeman".
3. Navigate to **Permission Management**.
4. Assign this "Junior Storeman" role strictly the `view_inventory` and `view_products` permissions, purposely excluding `view_sales` or `manage_users`.

**Exercise 2: Staff Onboarding**

1. Navigate to **Manage Users**.
2. Create a new user profile with a dummy email (e.g., `junior@test.com`).
3. Assign them the "Junior Storeman" role created in Exercise 1.
4. _Test:_ Log out as Administrator and log in as the Junior Storeman. Verify that the sidebar strictly restricts access to only Products and Current Stock.

**Exercise 3: Auditing and Reports**

1. Log back in as the Administrator.
2. Navigate to **Reports -> Sales Report**.
3. Locate the sale processed by the Storeman in their "Exercise 3". Validate that the system correctly calculated the revenue for the day.
4. Navigate to **Stock Logs**. Search for the `damaged` serial number the Storeman processed. Validate that the system tracked the exact time and User ID of the staff member who made the adjustment.

**Exercise 4: System-Wide Management**

1. Expand your sidebar fully to see all available modules (from Dashboard down to Reports and Permission Management).
2. Navigate to **Purchases** and **Sales / Out** to review the records processed by your staff during their training.
3. Make an **ADJUSTMENT** directly from the **Current Stock** page to simulate stepping in to assist a Storeman with advanced stock control.

**Exercise 5: Account Security & Profile Management**

1. Navigate to your **Profile** via the sidebar navigation.
2. Update your personal information (e.g., phone number or bio) and upload a new profile picture to personalize your dashboard.
3. Navigate to **Change Password** (Security Settings) to update your account's password. Confirm the change matches your new secure string.

**Exercise 6: Advanced User Management (Editing & Status Control)**

1. Navigate to **Manage Users** and locate the "Junior Storeman" you created during onboarding. Click their record to fetch their detailed profile (Get User by ID).
2. **Edit User Info:** Modify their assigned contact details or promote them by assigning an additional role, then save the changes.
3. **Deactivate User:** Temporarily suspend their account by marking them as Deactivated to cut off system access gracefully.
4. **Activate User:** Restore their account by Activating them, ensuring they can log in to the system again.

**Exercise 7: Category Management (Admin/Manager Restricted)**

1. Navigate to **Categories** from the sidebar navigation. Only Admins and Managers have full write access here.
2. **Add Category:** Click "Add Category" and create a test group appropriately named "Administrative Supplies".
3. **Search & Edit:** Use the search bar to locate your new category, then click the Edit button to update its description or toggle its active status.
4. **Delete Category:** Test the soft-delete functionality by deleting the category, ensuring it is removed from the active list of grouped items.
