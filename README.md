# Blood Donation Inventory Management System

This project is done as a part of the course *DATABASE MANAGEMENT SYSTEM (UE23CS351A)*. Blood donation and inventory management system is a full-stack web application designed to manage the operations of a blood bank. It provides a solution for tracking donors, managing blood inventory, handling hospital requests, and managing partner hospitals and blood banks.

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

**Frontend**:
- React + TypeScript
- Vite (fast build)
- Tailwind CSS (styling)
- shadcn/ui (component library)
- React Router (navigation)

**Backend**:
- Node.js + Express
- mysql2 (promise-based connection pool)
- CORS enabled
- Environment configuration via .env

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

## Additional Resources

- **DB_Logic.md**: Database Logic documentation and other references

## Collaborators
- [Cheruku Manas Ram](https://github.com/satoqibi)
