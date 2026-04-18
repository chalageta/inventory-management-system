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

> [!TIP]
> A product cannot be deleted if there is existing inventory tied to it. Archiving is recommended in these cases.

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

> [!IMPORTANT]
> Accuracy in keeping status updated ensures smooth sales processing and prevents overselling. 

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

As an **Administrator**, you have full access to the system. Beyond standard inventory operations, your core focus is on security, team organization, and high-level reporting.

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

> [!WARNING]
> Do not carelessly modify Administrator permission scopes. Removing critical permissions from the Admin role can permanently lock you out of system settings.

### System Reports
Data analysis across the entire warehouse pipeline.
1. Go to **Reports**.
2. **Sales Report:** Analyze revenue grouped by specific timeframes.
3. **Top Products:** Identify high-volume products to optimize future purchases and adjust `min_stock` counts.
