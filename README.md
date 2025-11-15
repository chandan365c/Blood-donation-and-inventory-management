# Blood Donation Inventory Management System

This is a full-stack web application designed to manage the operations of a blood bank. It provides a solution for tracking donors, managing blood inventory, handling hospital requests, and managing partner hospitals and blood banks.

The application features a frontend built with **React** and **TypeScript**, and a backend API powered by **Node.js**, **Express**, and **MySQL**.

## Key Features

### 1\. Dashboard

  * **Statistics:** View real-time counts of Total Donors, Available Blood Units, and Pending Requests.
  * **Inventory Overview:** See a detailed breakdown of available units for every blood type (O+, A-, AB+, etc.).

### 2\. Donor Management

  * **Add Donors:** Register new donors with their contact details and blood type.
  * **Search & Filter:** Easily find donors using the search bar.
  * **Eligibility Tracking:** The system automatically displays "Eligible" or "Ineligible" based on the donor's last donation date.

### 3\. Inventory Management

  * **Record Donations:** Add new blood units to the inventory.
      * **Smart Donor Selection:** Select a registered donor, and their blood type is automatically filled and locked to prevent data entry errors.
      * **Eligibility Check:** The system uses a database-level function (`CheckDonorEligibility`) to prevent recording a donation if the donor is not eligible (i.e., has donated within the last 56 days).
  * **Live Stock View:** See all blood bags, their collection/expiry dates, and their current status ('Available', 'Used', 'Expired').
  * **Expiry Tracking:** The UI highlights bags that have already expired.

### 4\. Blood Request Management

  * **Create Requests:** Log new blood requests from hospitals, specifying the blood bank, blood type, and units needed.
  * **Fulfill Requests:** Process pending requests with a single click.
      * **Transaction-Safe:** Fulfilling a request is a transaction-managed operation, handled by the `sp_FulfillBloodRequest` stored procedure.
      * **Expired Blood Prevention:** A database trigger (`trg_PreventUsingExpiredBlood`) **blocks the transaction** if it attempts to use blood that has passed its expiry date, returning a specific error to the user.
  * **View History:** See separate tables for all "Pending" and "Fulfilled" requests.

### 5\. Hospital & Blood Bank Management

  * **Full CRUD:** Add, view, edit, and manage partner hospitals and blood bank centers.
  * **View Request History:** In a hospital's "View Details" popup, see a complete history of all blood requests associated with that specific hospital, loaded via the `sp_GetHospitalRequestHistory` procedure.

-----

## Tech Stack

| Frontend | Backend | Database |
| :--- | :--- | :--- |
| React 18 | Node.js | MySQL |
| TypeScript | Express | SQL Stored Procedures |
| Vite | `mysql2/promise` | SQL Triggers & Functions |
| React Router v6 | | |
| Tailwind CSS | | |
| shadcn/ui | | |
| Lucide Icons | | |

-----

## Getting Started

### Prerequisites

  * Node.js
  * NPM
  * MySQL Server

### 1\. Clone the Repository

```bash
git clone https://github.com/chandan365c/Blood-donation-and-inventory-management.git
cd Blood-donation-and-inventory-management
```

### 2\. Backend Setup (API)

1.  Navigate to the backend directory.

    ```bash
    cd server
    ```

2.  Install dependencies.

    ```bash
    npm install
    ```

3.  Create a `.env` file in this directory with your MySQL credentials:

    ```.env
    DB_HOST=localhost
    DB_USER=your_mysql_user
    DB_PASS=your_mysql_password
    DB_NAME=blood
    DB_PORT=3306
    PORT=3001
    ```

4.  **Important: Database Setup.** You must run your SQL scripts to, the .sql file is provided in `src/blood.sql`:

      * Create the database schema (all tables: `Donors`, `BloodInventory`, `BloodRequests`, etc.).
      * Add the Stored Procedures, Functions, and Triggers.

5.  Start the backend server.

    ```bash
    npm run start
    ```
    The API will be running at `http://localhost:3001`.

### 3\. Frontend Setup (UI)

1.  Navigate to the root directory.
    
2.  Install dependencies.
    ```bash
    npm install
    ```
3.  Start the frontend development server.
    ```bash
    npm run dev
    ```
4.  Open your browser and navigate to the url indicated by Vite (eg: `http://localhost:8080/`).

-----

## Database Logic

This project's data integrity is enforced at the database level. To run this application, your MySQL database **must** include:

#### **`CheckDonorEligibility` (Function)**

Checks if a donor is eligible to donate (56-day cooldown).

```sql
-- Invoked by the backend:
SELECT CheckDonorEligibility(donor_id) AS isEligible;
```

#### **`trg_PreventUsingExpiredBlood` (Trigger)**

Attaches to `BloodInventory` on `BEFORE UPDATE`. Fails the transaction if `NEW.Status = 'Used'` and `NEW.ExpiryDate < CURDATE()`.

```sql
-- Invoked automatically by:
UPDATE BloodInventory SET Status = 'Used' WHERE BagID = 123;
```

#### **`sp_FulfillBloodRequest` (Stored Procedure)**

Wraps the fulfillment process in a transaction. It correctly catches and re-throws specific errors from triggers.

```sql
-- Invoked by the backend:
CALL sp_FulfillBloodRequest(request_id);
```

#### **`sp_GetHospitalRequestHistory` (Stored Procedure)**

Fetches all requests for a specific hospital, joining with `BloodBanks` to get the bank name.

```sql
-- Invoked by the backend:
CALL sp_GetHospitalRequestHistory(hospital_id);
```

-----

## Endpoints

A brief overview of the main API endpoints.

| Method | Route | Description |
| :--- | :--- | :--- |
| `GET` | `/api/donors` | Get all donors. |
| `POST` | `/api/donors` | Create a new donor. |
| `GET` | `/api/inventory` | Get all inventory items. |
| `POST` | `/api/inventory` | Record a new donation (checks eligibility). |
| `GET` | `/api/requests` | Get all blood requests. |
| `POST` | `/api/requests` | Create a new blood request. |
| `POST` | `/api/requests/:id/fulfill` | Fulfill a blood request (uses `sp_FulfillBloodRequest`). |
| `GET` | `/api/hospitals` | Get all hospitals. |
| `POST` | `/api/hospitals` | Create a new hospital. |
| `PUT` | `/api/hospitals/:id` | Update a hospital. |
| `GET` | `/api/hospitals/:id/requesthistory` | Get request history for one hospital (uses `sp_GetHospitalRequestHistory`). |
| `GET` | `/api/bloodbanks` | Get all blood banks. |
| `POST` | `/api/bloodbanks` | Create a new blood bank. |

-----
