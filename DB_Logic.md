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

## Summary Table

| Component | Type | Purpose | Used In |
|-----------|------|---------|---------|
| `trg_SetExpiryDate` | Trigger | Auto-calculate expiry (42 days) | Blood Inventory |
| `trg_UpdateLastDonationDate` | Trigger | Update donor's last donation | Blood Inventory |
| `trg_PreventUsingExpiredBlood` | Trigger | Block expired blood usage | Blood Inventory |
| `trg_CheckRequestAmount` | Trigger | Validate request quantities | Blood Requests |
| `trg_ValidateBloodType` | Trigger | Validate blood type | Donors |
| `CheckDonorEligibility` | Function | Check 56-day cooldown | Donor Donations |
| `GetAvailableUnits` | Function | Count available stock | Fulfillment |
| `IsBloodCompatible` | Function | Check blood compatibility | Compatibility Checks |
| `sp_RegisterDonor` | Procedure | Register new donor | Donor Management |
| `sp_AddNewDonation` | Procedure | Record donation | Donations |
| `sp_FulfillBloodRequest` | Procedure | Fulfill request (transaction) | Request Fulfillment |
| `sp_GetHospitalRequestHistory` | Procedure | Get hospital's requests | Hospital Details |

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

## Additional Resources

- **blood.sql**: Full database schema and all objects
- **server/index.js**: Backend API endpoints
- **src/lib/apiClient.ts**: Frontend API client functions
- **src/pages/**: React pages for each feature
