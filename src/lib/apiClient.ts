// Typed API client for backend endpoints
// Default to localhost:3001 in development when VITE_API_URL is not set to avoid
// accidental requests to the frontend host that return HTML (causing JSON parse errors).
const rawApiBase = import.meta.env?.VITE_API_URL || '';
const devFallback = (import.meta.env && (import.meta.env.MODE !== 'production')) ? 'http://localhost:3001' : '';
const API_BASE = (rawApiBase || devFallback).replace(/\/+$/, '');

function handle(res: Response) {
  return res.json().then((json) => {
    if (!res.ok) throw new Error(json?.error || 'Request failed');
    return json;
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
