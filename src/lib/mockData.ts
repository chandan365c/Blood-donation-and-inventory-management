// Mock data for demonstration
// Replace with actual MySQL database calls

export interface Donor {
  DonorID: number;
  FirstName: string;
  LastName: string;
  BloodType: string;
  PhoneNumber: string;
  City: string;
  LastDonationDate: string | null;
}

export interface BloodBank {
  BankID: number;
  Name: string;
  Address: string;
  ContactPerson: string;
}

export interface Hospital {
  HospitalID: number;
  Name: string;
  Address: string;
}

export interface BloodInventory {
  BagID: number;
  DonorID: number;
  BankID: number;
  BloodType: string;
  CollectionDate: string;
  ExpiryDate: string;
  Status: string;
}

export interface BloodRequest {
  RequestID: number;
  HospitalID: number;
  BankID: number;
  RequiredBloodType: string;
  UnitsNeeded: number;
  RequestDate: string;
  Status: string;
}

// Mock data
export const mockDonors: Donor[] = [
  { DonorID: 1, FirstName: "John", LastName: "Doe", BloodType: "O+", PhoneNumber: "555-0101", City: "New York", LastDonationDate: "2024-09-15" },
  { DonorID: 2, FirstName: "Jane", LastName: "Smith", BloodType: "A+", PhoneNumber: "555-0102", City: "Los Angeles", LastDonationDate: "2024-10-01" },
  { DonorID: 3, FirstName: "Mike", LastName: "Johnson", BloodType: "B+", PhoneNumber: "555-0103", City: "Chicago", LastDonationDate: null },
  { DonorID: 4, FirstName: "Sarah", LastName: "Williams", BloodType: "AB+", PhoneNumber: "555-0104", City: "Houston", LastDonationDate: "2024-08-20" },
  { DonorID: 5, FirstName: "David", LastName: "Brown", BloodType: "O-", PhoneNumber: "555-0105", City: "Phoenix", LastDonationDate: "2024-09-30" },
];

export const mockBloodBanks: BloodBank[] = [
  { BankID: 1, Name: "Central Blood Bank", Address: "123 Main St, New York, NY 10001", ContactPerson: "Dr. Emily Roberts" },
  { BankID: 2, Name: "City Blood Center", Address: "456 Oak Ave, Los Angeles, CA 90001", ContactPerson: "Dr. Michael Chen" },
  { BankID: 3, Name: "Metro Blood Services", Address: "789 Pine Rd, Chicago, IL 60601", ContactPerson: "Dr. Sarah Johnson" },
];

export const mockHospitals: Hospital[] = [
  { HospitalID: 1, Name: "General Hospital", Address: "100 Medical Plaza, New York, NY 10002" },
  { HospitalID: 2, Name: "City Medical Center", Address: "200 Health Blvd, Los Angeles, CA 90002" },
  { HospitalID: 3, Name: "Community Hospital", Address: "300 Care St, Chicago, IL 60602" },
  { HospitalID: 4, Name: "Regional Medical Center", Address: "400 Wellness Ave, Houston, TX 77001" },
];

export const mockInventory: BloodInventory[] = [
  { BagID: 1, DonorID: 1, BankID: 1, BloodType: "O+", CollectionDate: "2024-09-15", ExpiryDate: "2024-10-27", Status: "Available" },
  { BagID: 2, DonorID: 2, BankID: 1, BloodType: "A+", CollectionDate: "2024-10-01", ExpiryDate: "2024-11-12", Status: "Available" },
  { BagID: 3, DonorID: 5, BankID: 2, BloodType: "O-", CollectionDate: "2024-09-30", ExpiryDate: "2024-11-11", Status: "Available" },
  { BagID: 4, DonorID: 1, BankID: 1, BloodType: "O+", CollectionDate: "2024-08-01", ExpiryDate: "2024-09-12", Status: "Expired" },
  { BagID: 5, DonorID: 4, BankID: 3, BloodType: "AB+", CollectionDate: "2024-10-10", ExpiryDate: "2024-11-21", Status: "Available" },
];

export const mockRequests: BloodRequest[] = [
  { RequestID: 1, HospitalID: 1, BankID: 1, RequiredBloodType: "O+", UnitsNeeded: 3, RequestDate: "2024-10-20", Status: "Pending" },
  { RequestID: 2, HospitalID: 2, BankID: 2, RequiredBloodType: "A+", UnitsNeeded: 2, RequestDate: "2024-10-21", Status: "Pending" },
  { RequestID: 3, HospitalID: 3, BankID: 3, RequiredBloodType: "B+", UnitsNeeded: 1, RequestDate: "2024-10-15", Status: "Fulfilled" },
  { RequestID: 4, HospitalID: 1, BankID: 1, RequiredBloodType: "O-", UnitsNeeded: 5, RequestDate: "2024-10-22", Status: "Pending" },
];

// Utility functions
export const getBloodTypeColor = (bloodType: string): string => {
  const colors: Record<string, string> = {
    "A+": "blood-a-plus",
    "A-": "blood-a-minus",
    "B+": "blood-b-plus",
    "B-": "blood-b-minus",
    "AB+": "blood-ab-plus",
    "AB-": "blood-ab-minus",
    "O+": "blood-o-plus",
    "O-": "blood-o-minus",
  };
  return colors[bloodType] || "primary";
};

export const getStatusColor = (status: string): string => {
  const colors: Record<string, string> = {
    Available: "success",
    Pending: "warning",
    Fulfilled: "success",
    Expired: "destructive",
    Used: "muted",
  };
  return colors[status] || "muted";
};

// Database connection placeholder
export const DATABASE_CONFIG = {
  host: "localhost",
  user: "your_mysql_user",
  password: "your_mysql_password",
  database: "blood",
  port: 3306,
};

// executeSQLQuery will call the local backend if VITE_API_URL is set
export const executeSQLQuery = async (query: string, params?: any[]): Promise<any> => {
  try {
    const apiBase = (import.meta as any).env?.VITE_API_URL || '';
    if (!apiBase) {
      // No backend configured — keep placeholder behavior
      console.log("SQL Query Placeholder (no VITE_API_URL):", query, params);
      throw new Error("Database connection not configured. Set VITE_API_URL to enable.");
    }

    const res = await fetch(`${apiBase.replace(/\/+$/, '')}/api/query`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, params }),
    });

    const json = await res.json();
    if (!res.ok) {
      throw new Error(json?.error || 'Query failed');
    }

    return json.rows;
  } catch (err: any) {
    console.error('executeSQLQuery error:', err?.message || err);
    throw err;
  }
};
