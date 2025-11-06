create database blood;
USE blood;

-- -----------------------------------------------------
-- Table `Donors`
-- Stores information about each unique blood donor.
-- -----------------------------------------------------
CREATE TABLE Donors (
    DonorID INT PRIMARY KEY AUTO_INCREMENT,
    FirstName VARCHAR(50) NOT NULL,
    LastName VARCHAR(50) NOT NULL,
    BloodType VARCHAR(3) NOT NULL,
    PhoneNumber VARCHAR(15) NOT NULL UNIQUE,
    City VARCHAR(50),
    LastDonationDate DATE
);

-- -----------------------------------------------------
-- Table `BloodBanks`
-- Stores information about the blood bank centers.
-- -----------------------------------------------------
CREATE TABLE BloodBanks (
    BankID INT PRIMARY KEY AUTO_INCREMENT,
    Name VARCHAR(100) NOT NULL,
    Address VARCHAR(255) NOT NULL,
    ContactPerson VARCHAR(100)
);

-- -----------------------------------------------------
-- Table `Hospitals`
-- Stores information about the hospitals that request blood.
-- -----------------------------------------------------
CREATE TABLE Hospitals (
    HospitalID INT PRIMARY KEY AUTO_INCREMENT,
    Name VARCHAR(100) NOT NULL,
    Address VARCHAR(255) NOT NULL
);
show triggers;
-- -----------------------------------------------------
-- Table `BloodInventory`
-- Tracks each individual unit of blood from donation.
-- -----------------------------------------------------
CREATE TABLE BloodInventory (
    BagID INT PRIMARY KEY AUTO_INCREMENT,
    DonorID INT NOT NULL,
    BankID INT NOT NULL,
    BloodType VARCHAR(3) NOT NULL,
    CollectionDate DATE NOT NULL,
    ExpiryDate DATE NOT NULL,
    Status VARCHAR(20) NOT NULL DEFAULT 'Available',
    -- Foreign key constraints for maximum data integrity
    FOREIGN KEY (DonorID) REFERENCES Donors(DonorID) ON DELETE RESTRICT,
    FOREIGN KEY (BankID) REFERENCES BloodBanks(BankID) ON DELETE CASCADE
);

-- -----------------------------------------------------
-- Table `BloodRequests`
-- Logs all requests for blood made by hospitals.
-- -----------------------------------------------------
CREATE TABLE BloodRequests (
    RequestID INT PRIMARY KEY AUTO_INCREMENT,
    HospitalID INT NOT NULL,
    BankID INT NOT NULL,
    RequiredBloodType VARCHAR(3) NOT NULL,
    UnitsNeeded INT NOT NULL,
    RequestDate DATE NOT NULL DEFAULT (CURRENT_DATE),
    Status VARCHAR(20) NOT NULL DEFAULT 'Pending',
    -- Foreign key constraints
    FOREIGN KEY (HospitalID) REFERENCES Hospitals(HospitalID) ON DELETE CASCADE,
    FOREIGN KEY (BankID) REFERENCES BloodBanks(BankID) ON DELETE CASCADE
);

-- -----------------------------------------------------------------------------------
-- TRIGGER 1: trg_SetExpiryDate
--
-- PURPOSE: Automatically calculates and sets the `ExpiryDate` for a new blood bag.
-- EVENT:   Fires BEFORE a new record is INSERTED into `BloodInventory`.
-- LOGIC:   Sets the `ExpiryDate` to 42 days (the standard shelf-life for
--          whole blood) after the `CollectionDate`.
-- -----------------------------------------------------------------------------------

DELIMITER $$
CREATE TRIGGER trg_SetExpiryDate
BEFORE INSERT ON BloodInventory
FOR EACH ROW
BEGIN
    -- The NEW keyword refers to the row that is about to be inserted.
    SET NEW.ExpiryDate = DATE_ADD(NEW.CollectionDate, INTERVAL 42 DAY);
END$$
DELIMITER ;


-- -----------------------------------------------------------------------------------
-- TRIGGER 2: trg_UpdateLastDonationDate
--
-- PURPOSE: Keeps the `LastDonationDate` in the `Donors` table synchronized.
-- EVENT:   Fires AFTER a new record is INSERTED into `BloodInventory`.
-- LOGIC:   When a new donation is successfully logged, this trigger updates
--          the corresponding donor's record with the date of this new donation.
-- -----------------------------------------------------------------------------------

DELIMITER $$
CREATE TRIGGER trg_UpdateLastDonationDate
AFTER INSERT ON BloodInventory
FOR EACH ROW
BEGIN
    -- The NEW keyword refers to the row that was just inserted.
    UPDATE Donors
    SET LastDonationDate = NEW.CollectionDate
    WHERE DonorID = NEW.DonorID;
END$$
DELIMITER ;


-- -----------------------------------------------------------------------------------
-- TRIGGER 3: trg_PreventUsingExpiredBlood
--
-- PURPOSE: Enforces a critical patient safety rule. Prevents expired blood
--          from being marked as 'Used'.
-- EVENT:   Fires BEFORE a record in `BloodInventory` is UPDATED.
-- LOGIC:   If the `Status` is being changed to 'Used', the trigger checks
--          if the blood's `ExpiryDate` has already passed. If it has,
--          the trigger blocks the update and raises a custom error.
-- -----------------------------------------------------------------------------------

DELIMITER $$
CREATE TRIGGER trg_PreventUsingExpiredBlood
BEFORE UPDATE ON BloodInventory
FOR EACH ROW
BEGIN
    -- The OLD keyword refers to the data as it was before the UPDATE.
    -- The NEW keyword refers to the new data being proposed.

    -- Check if the status is being changed TO 'Used'
    IF NEW.Status = 'Used' AND OLD.Status <> 'Used' THEN
        -- Check if the blood is expired as of today
        IF NEW.ExpiryDate < CURDATE() THEN
            -- Raise an error and stop the UPDATE
            -- SQLSTATE '45000' is a generic state for user-defined errors.
            SIGNAL SQLSTATE '45000'
                SET MESSAGE_TEXT = 'Error: Cannot mark blood as "Used". This unit expired on ';
        END IF;
    END IF;
END$$
DELIMITER ;

-- -----------------------------------------------------------------------------------
-- TRIGGER 4: trg_CheckRequestAmount
--
-- PURPOSE: Ensures that all new blood requests specify a valid, positive
--          number of blood units needed.
-- EVENT:   Fires BEFORE a record is INSERTED into the `BloodRequests` table.
-- LOGIC:   Checks if the `UnitsNeeded` value in the new record is greater than zero.
--          If it is zero or negative, the trigger raises an error and prevents the insertion.
-- -----------------------------------------------------------------------------------

DELIMITER $$
CREATE TRIGGER trg_CheckRequestAmount
BEFORE INSERT ON BloodRequests
FOR EACH ROW
BEGIN
    -- Check if the units needed is a positive number
    IF NEW.UnitsNeeded <= 0 THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Error: Units needed must be a positive number (1 or more).';
    END IF;
END$$
DELIMITER ;

-- -----------------------------------------------------------------------------------
-- TRIGGER 5: trg_ValidateBloodType
--
-- PURPOSE: Ensures data integrity by validating that any new donor record
--          has a properly formatted and recognized blood type.
-- EVENT:   Fires BEFORE a record is INSERTED into the `Donors` table.
-- LOGIC:   Checks the `BloodType` value in the new record. If it is not one
--          of the valid blood types ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'),
--          the trigger raises an error and prevents the insertion.
-- -----------------------------------------------------------------------------------

DELIMITER $$
CREATE TRIGGER trg_ValidateBloodType
BEFORE INSERT ON Donors
FOR EACH ROW
BEGIN
    IF NEW.BloodType NOT IN ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-') THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Error: Invalid blood type format.';
    END IF;
END$$
DELIMITER ;


-- -----------------------------------------------------------------------------------
-- FUNCTION 1: CheckDonorEligibility
--
-- PURPOSE: Checks if a donor is eligible to donate today.
-- LOGIC:   A donor is eligible if their LastDonationDate is NULL (new donor)
--          or if it was more than 56 days ago (standard cooldown).
--
-- @param   donorID_param INT - The ID of the donor to check.
-- @return  INT - Returns 1 if eligible, 0 if not eligible.
-- -----------------------------------------------------------------------------------

DELIMITER $$
CREATE FUNCTION CheckDonorEligibility(donorID_param INT)
RETURNS INT
DETERMINISTIC
BEGIN
    DECLARE lastDonation DATE;
    DECLARE isEligible INT DEFAULT 0;

    -- Get the donor's last donation date
    SELECT LastDonationDate INTO lastDonation
    FROM Donors
    WHERE DonorID = donorID_param;

    -- Check the 56-day rule
    IF lastDonation IS NULL THEN
        SET isEligible = 1; -- Eligible (first-time donor)
    ELSEIF DATEDIFF(CURDATE(), lastDonation) > 56 THEN
        SET isEligible = 1; -- Eligible (cooldown period has passed)
    ELSE
        SET isEligible = 0; -- Not eligible (still in cooldown)
    END IF;

    RETURN isEligible;
END$$
DELIMITER ;

-- ---
-- HOW TO USE FUNCTION 1:
-- ---
-- SELECT DonorID, FirstName, CheckDonorEligibility(DonorID) AS IsEligible
-- FROM Donors;
--


-- -----------------------------------------------------------------------------------
-- FUNCTION 2: GetAvailableUnits
--
-- PURPOSE: Gets the current count of available units for a specific blood type
--          at a specific blood bank.
--
-- @param   bloodType_param VARCHAR(3) - The blood type to check (e.g., 'O-').
-- @param   bankID_param INT - The ID of the blood bank.
-- @return  INT - The number of available units.
-- -----------------------------------------------------------------------------------

DELIMITER $$
CREATE FUNCTION GetAvailableUnits(bloodType_param VARCHAR(3), bankID_param INT)
RETURNS INT
DETERMINISTIC
BEGIN
    DECLARE unitCount INT DEFAULT 0;

    SELECT COUNT(*) INTO unitCount
    FROM BloodInventory
    WHERE BloodType = bloodType_param
      AND BankID = bankID_param
      AND Status = 'Available';

    RETURN unitCount;
END$$
DELIMITER ;

-- ---
-- HOW TO USE FUNCTION 2:
-- ---
-- -- Get the current stock of 'O-' blood at Bank ID 1
-- SELECT GetAvailableUnits('O-', 1) AS O_Negative_Stock;
--


-- -----------------------------------------------------------------------------------
-- FUNCTION 3: IsBloodCompatible
--
-- PURPOSE: Encapsulates the complex blood compatibility rules.
-- LOGIC:   Checks if a donor's blood type can be safely given to a recipient
--          with another blood type.
--
-- @param   recipientType VARCHAR(3) - The recipient's blood type.
-- @param   donorType VARCHAR(3) - The donor's blood type.
-- @return  INT - Returns 1 if compatible, 0 if not.
-- -----------------------------------------------------------------------------------

DELIMITER $$
CREATE FUNCTION IsBloodCompatible(recipientType VARCHAR(3), donorType VARCHAR(3))
RETURNS INT
DETERMINISTIC
BEGIN
    DECLARE isCompatible INT DEFAULT 0;

    CASE recipientType
        WHEN 'A+' THEN
            IF donorType IN ('A+', 'A-', 'O+', 'O-') THEN SET isCompatible = 1; END IF;
        WHEN 'A-' THEN
            IF donorType IN ('A-', 'O-') THEN SET isCompatible = 1; END IF;
        WHEN 'B+' THEN
            IF donorType IN ('B+', 'B-', 'O+', 'O-') THEN SET isCompatible = 1; END IF;
        WHEN 'B-' THEN
            IF donorType IN ('B-', 'O-') THEN SET isCompatible = 1; END IF;
        WHEN 'AB+' THEN
            SET isCompatible = 1; -- Universal recipient
        WHEN 'AB-' THEN
            IF donorType IN ('AB-', 'A-', 'B-', 'O-') THEN SET isCompatible = 1; END IF;
        WHEN 'O+' THEN
            IF donorType IN ('O+', 'O-') THEN SET isCompatible = 1; END IF;
        WHEN 'O-' THEN
            IF donorType IN ('O-') THEN SET isCompatible = 1; END IF;
        ELSE
            SET isCompatible = 0; -- Unknown blood type
    END CASE;

    RETURN isCompatible;
END$$
DELIMITER ;

-- ---
-- HOW TO USE FUNCTION 3:
-- ---
-- -- Find all donors who can donate to a patient with 'A+' blood
-- SELECT FirstName, LastName, BloodType
-- FROM Donors
-- WHERE IsBloodCompatible('A+', BloodType) = 1;
--

-- -----------------------------------------------------------------------------------
-- PROCEDURE 1: sp_RegisterDonor
--
-- PURPOSE: Safely registers a new donor in the `Donors` table.
-- LOGIC:   Performs an INSERT and includes an error handler to
--          prevent duplicate phone numbers (which have a UNIQUE constraint).
--
-- TO CALL:
-- CALL sp_RegisterDonor('Rohan', 'Mehta', 'B+', '9876543210', 'rohan@example.com', 'Mumbai');
-- -----------------------------------------------------------------------------------

DELIMITER $$
CREATE PROCEDURE sp_RegisterDonor(
    IN firstName_param VARCHAR(50),
    IN lastName_param VARCHAR(50),
    IN bloodType_param VARCHAR(3),
    IN phone_param VARCHAR(15),
    IN city_param VARCHAR(50)
)
BEGIN
    -- Declare an exit handler for duplicate key errors (Error 1062)
    DECLARE EXIT HANDLER FOR 1062
    BEGIN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Error: A donor with this phone number or email already exists.';
    END;

    -- Insert the new donor
    INSERT INTO Donors (FirstName, LastName, BloodType, PhoneNumber, City)
    VALUES (firstName_param, lastName_param, bloodType_param, phone_param, city_param);
END$$
DELIMITER ;


-- -----------------------------------------------------------------------------------
-- PROCEDURE 2: sp_AddNewDonation
--
-- PURPOSE: Logs a new donation from an existing donor.
-- LOGIC:   1. Uses the `CheckDonorEligibility` function to verify the donor
--             can donate.
--          2. If eligible, it fetches the donor's blood type and inserts a
--             new record into `BloodInventory`.
--          3. Triggers (trg_SetExpiryDate, trg_UpdateLastDonationDate)
--             will fire automatically after the INSERT.
--
-- TO CALL:
-- CALL sp_AddNewDonation(1, 1); -- (DonorID 1, BankID 1)
-- -----------------------------------------------------------------------------------

DELIMITER $$
CREATE PROCEDURE sp_AddNewDonation(
    IN donorID_param INT,
    IN bankID_param INT
)
BEGIN
    DECLARE isEligible INT;
    DECLARE donorBloodType VARCHAR(3);

    -- 1. Check eligibility using the function
    SET isEligible = CheckDonorEligibility(donorID_param);

    IF isEligible = 1 THEN
        -- 2. Get the donor's blood type
        SELECT BloodType INTO donorBloodType
        FROM Donors
        WHERE DonorID = donorID_param;

        -- 3. Insert the new donation record.
        -- CollectionDate is set to today. Status defaults to 'Available'.
        -- The trg_SetExpiryDate trigger will auto-calculate the ExpiryDate.
        INSERT INTO BloodInventory (DonorID, BankID, BloodType, CollectionDate)
        VALUES (donorID_param, bankID_param, donorBloodType, CURDATE());

        -- The trg_UpdateLastDonationDate trigger will now fire automatically
        -- to update the Donors table.

    ELSE
        -- 4. If not eligible, raise an error
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Error: Donor is not eligible to donate yet (must wait 56 days).';
    END IF;
END$$
DELIMITER ;


-- -----------------------------------------------------------------------------------
-- PROCEDURE 3: sp_FulfillBloodRequest
--
-- PURPOSE: Fulfills a blood request using a transaction. This is the
--          most critical procedure in the system.
-- LOGIC:   1. Starts a transaction.
--          2. Gets the request details (units, type, bank).
--          3. Checks if there is enough stock using `GetAvailableUnits`.
--          4. If stock is sufficient, it updates the `BloodInventory`
--             (sets Status to 'Used' for the oldest X units).
--          5. Updates the `BloodRequests` table (sets Status to 'Fulfilled').
--          6. If stock is low or any step fails, it ROLLS BACK all changes.
--
-- TO CALL:
-- CALL sp_FulfillBloodRequest(1); -- (RequestID 1)
-- -----------------------------------------------------------------------------------

DELIMITER $$
CREATE PROCEDURE sp_FulfillBloodRequest(
    IN requestID_param INT
)
BEGIN
    DECLARE units_needed INT;
    DECLARE blood_type VARCHAR(3);
    DECLARE bank_id INT;
    DECLARE available_units INT;

    -- Declare an exit handler for any SQL error.
    -- If anything goes wrong, roll back the entire transaction.
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Error: Transaction failed and was rolled back.';
    END;

    -- Start the transaction
    START TRANSACTION;

    -- 1. Get the request details
    SELECT UnitsNeeded, RequiredBloodType, BankID INTO units_needed, blood_type, bank_id
    FROM BloodRequests
    WHERE RequestID = requestID_param AND Status = 'Pending'
    FOR UPDATE; -- Locks the request row to prevent other changes

        -- 2. Check for sufficient stock (ignore expired units)
        SELECT COUNT(*) INTO available_units
        FROM BloodInventory
        WHERE BloodType = blood_type
            AND BankID = bank_id
            AND Status = 'Available'
            AND ExpiryDate >= CURDATE();

        IF available_units < units_needed THEN
            -- Not enough non-expired stock. Roll back and signal an error.
            ROLLBACK;
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Error: Insufficient non-expired stock to fulfill this request.';
        ELSE
            -- 3. We have sufficient non-expired stock. Update the oldest available (non-expired) units in inventory.
            UPDATE BloodInventory
            SET Status = 'Used'
            WHERE BankID = bank_id
                AND BloodType = blood_type
                AND Status = 'Available'
                AND ExpiryDate >= CURDATE()
            ORDER BY ExpiryDate ASC -- Use the oldest non-expired blood first
            LIMIT units_needed;     -- Fulfill the exact number needed

            -- 4. Update the blood request to show it's fulfilled
            UPDATE BloodRequests
            SET Status = 'Fulfilled'
            WHERE RequestID = requestID_param;

            -- 5. All steps succeeded. Commit the changes.
            COMMIT;

        END IF;
END$$
DELIMITER ;

-- -----------------------------------------------------------------------------------
-- PROCEDURE 4: sp_GetHospitalRequestHistory
--
-- PURPOSE: Retrieves a full history of all blood requests for a single
--          hospital, including the human-readable name of the blood bank
--          that the request was sent to.
--
-- @param   hospitalID_param INT - The ID of the hospital to check.
--
-- TO CALL:
-- CALL sp_GetHospitalRequestHistory(1); -- (Assuming 1 is a valid HospitalID)
-- -----------------------------------------------------------------------------------

DELIMITER $$
CREATE PROCEDURE sp_GetHospitalRequestHistory(
    IN hospitalID_param INT
)
BEGIN
    SELECT
        r.RequestID,
        r.RequestDate,
        b.Name AS BloodBankName,  -- This data comes from the JOIN
        r.RequiredBloodType,
        r.UnitsNeeded,
        r.Status
    FROM
        BloodRequests AS r
    JOIN
        BloodBanks AS b ON r.BankID = b.BankID
    WHERE
        r.HospitalID = hospitalID_param
    ORDER BY
        r.RequestDate DESC;
END$$
DELIMITER ;

-- Insert two new donors.
-- Their 'LastDonationDate' will be NULL by default.
INSERT INTO Donors (FirstName, LastName, BloodType, PhoneNumber, City)
VALUES ('Priya', 'Sharma', 'O-', '9111122222', 'Mumbai');

INSERT INTO Donors (FirstName, LastName, BloodType, PhoneNumber, City)
VALUES ('Arjun', 'Kumar', 'A+', '9333344444', 'Delhi');

-- Insert one blood bank
INSERT INTO BloodBanks (Name, Address, ContactPerson)
VALUES ('City General Blood Bank', '123 Main St, Bengaluru', 'Dr. Singh');

-- Check that they were added
SELECT * FROM Donors;
SELECT * FROM BloodBanks;

-- This INSERT will fire trg_SetExpiryDate and trg_UpdateLastDonationDate
-- We only provide the CollectionDate. The ExpiryDate will be auto-calculated.
INSERT INTO BloodInventory (DonorID, BankID, BloodType, CollectionDate)
VALUES (1, 1, 'O-', '2025-10-27');

select * from BloodInventory;

-- Step 1: Add a donation from Arjun (DonorID 2) with a very old date.
-- (trg_SetExpiryDate will fire and set its ExpiryDate to Sept 12, 2025)
INSERT INTO BloodInventory (DonorID, BankID, BloodType, CollectionDate)
VALUES (2, 1, 'A+', '2025-08-01');

-- Step 2: Verify the expired bag is in the system
-- (Note its BagID, it will probably be 2)
SELECT * FROM BloodInventory WHERE DonorID = 2;

-- Step 3: This UPDATE will fire trg_PreventUsingExpiredBlood
-- The trigger will check the ExpiryDate (2025-09-12), see that it's
-- before today (2025-10-27), and block the update.
UPDATE BloodInventory
SET Status = 'Used'
WHERE BagID = 2;
-- You should receive an error message similar to:
-- "Error: Cannot mark blood as "Used". This unit expired on ..."


-- NESTED QUERY 1: Finding Donors with a Specific Blood Type
SELECT
    FirstName,
    LastName,
    PhoneNumber
FROM
    Donors
WHERE
    DonorID IN (
        -- This is the nested query (subquery)
        SELECT DonorID
        FROM BloodInventory
        WHERE BloodType = 'O-'
    );

-- NESTED QUERY 2: Finding Donors Who Have Never Donated
SELECT
    FirstName,
    LastName
FROM
    Donors
WHERE
    DonorID NOT IN (
        -- This is the nested query (subquery)
        SELECT DISTINCT DonorID
        FROM BloodInventory
    );