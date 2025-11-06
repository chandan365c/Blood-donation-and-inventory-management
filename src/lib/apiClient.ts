// Typed API client for backend endpoints
// Default to localhost:3001 in development when VITE_API_URL is not set to avoid
// accidental requests to the frontend host that return HTML (causing JSON parse errors).
const rawApiBase = import.meta.env?.VITE_API_URL || '';
const devFallback = (import.meta.env && (import.meta.env.MODE !== 'production')) ? 'http://localhost:3001' : '';
const API_BASE = (rawApiBase || devFallback).replace(/\/+$/, '');

// A new, more robust handle function
function handle(res: Response) {
  // First, check if the response is successful
  if (res.ok) {
    // If it's OK, parse it as JSON
    return res.json();
  }

  // If the response was NOT ok (like a 400), try to get a text error message
  return res.text().then((text) => {
    let json;
    try {
      // Try to parse the text as JSON
      json = JSON.parse(text);
    } catch (e) {
      // If parsing fails, it wasn't JSON. Throw the generic status text.
      console.error("Non-JSON error response:", text);
      throw new Error(res.statusText || 'Request failed');
    }

    // If parsing succeeded, throw the *specific error* from the JSON body.
    throw new Error(json?.error || res.statusText || 'Request failed');
  });
}

// --- Donors ---
export function getDonors() {
  return fetch(`${API_BASE}/api/donors`).then(handle);
}
export function createDonor(payload: {
  FirstName: string;
  LastName: string;
  BloodType: string;
  PhoneNumber: string;
  Email?: string;
  City?: string;
}) {
  return fetch(`${API_BASE}/api/donors`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  }).then(handle);
}
export function donate(donorId: number, bankId: number) {
  return fetch(`${API_BASE}/api/donors/${donorId}/donate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ bankId }),
  }).then(handle);
}

// --- Hospitals ---
export function getHospitals() {
  return fetch(`${API_BASE}/api/hospitals`).then(handle);
}
export function createHospital(payload: { Name: string; Address: string }) {
  return fetch(`${API_BASE}/api/hospitals`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  }).then(handle);
}
export function getHospitalById(id: number) {
  return fetch(`${API_BASE}/api/hospitals/${id}`).then(handle);
}
export function updateHospital(id: number, payload: { Name: string; Address: string }) {
  return fetch(`${API_BASE}/api/hospitals/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  }).then(handle);
}
export function getHospitalRequestHistory(id: number) {
  // This function assumes you have a backend endpoint that calls your stored procedure
  // e.g., GET /api/hospitals/:id/requesthistory
  return fetch(`${API_BASE}/api/hospitals/${id}/requesthistory`).then(handle);
}

// --- BloodBanks ---
export function getBloodBanks() {
  return fetch(`${API_BASE}/api/bloodbanks`).then(handle);
}
export function createBloodBank(payload: { Name: string; Address: string; ContactPerson?: string }) {
  return fetch(`${API_BASE}/api/bloodbanks`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  }).then(handle);
}
export function getBloodBankById(id: number) {
  return fetch(`${API_BASE}/api/bloodbanks/${id}`).then(handle);
}
export function updateBloodBank(id: number, payload: { Name: string; Address: string; ContactPerson?: string }) {
  return fetch(`${API_BASE}/api/bloodbanks/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  }).then(handle);
}

// --- Inventory ---
export function getInventory() {
  return fetch(`${API_BASE}/api/inventory`).then(handle);
}
export function addInventory(payload: { DonorID: number; BankID: number; BloodType: string; CollectionDate: string }) {
  return fetch(`${API_BASE}/api/inventory`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  }).then(handle);
}

// --- Requests ---
export function getRequests() {
  return fetch(`${API_BASE}/api/requests`).then(handle);
}
export function createRequest(payload: { HospitalID: number; BankID: number; RequiredBloodType: string; UnitsNeeded: number }) {
  return fetch(`${API_BASE}/api/requests`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  }).then(handle);
}
export function fulfillRequest(requestId: number) {
  return fetch(`${API_BASE}/api/requests/${requestId}/fulfill`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  }).then(handle);
}

// --- Health check ---
export function healthCheck() {
  return fetch(`${API_BASE}/api/health`).then(handle);
}
