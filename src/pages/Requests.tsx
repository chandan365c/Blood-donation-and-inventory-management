import { FileText, CheckCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useEffect, useState } from "react";
import { getRequests, getHospitals, getBloodBanks, fulfillRequest } from "@/lib/apiClient";
import { BloodRequest, Hospital, BloodBank, getBloodTypeColor } from "@/lib/mockData";

const Requests = () => {
  const [requests, setRequests] = useState<BloodRequest[]>([]);
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [banks, setBanks] = useState<BloodBank[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fulfilling, setFulfilling] = useState<number | null>(null);

  useEffect(() => {
    setLoading(true);
    Promise.all([getRequests(), getHospitals(), getBloodBanks()])
      .then(([reqData, hospData, bankData]) => {
        setRequests(reqData);
        setHospitals(hospData);
        setBanks(bankData);
      })
      .catch((err) => setError(err.message || "Failed to fetch requests data"))
      .finally(() => setLoading(false));
  }, []);

  const getHospitalName = (hospitalId: number) => {
    const hospital = hospitals.find((h) => h.HospitalID === hospitalId);
    return hospital ? hospital.Name : "Unknown";
  };

  const getBankName = (bankId: number) => {
    const bank = banks.find((b) => b.BankID === bankId);
    return bank ? bank.Name : "Unknown";
  };

  const pendingRequests = requests.filter((req) => req.Status === "Pending");
  const fulfilledRequests = requests.filter((req) => req.Status === "Fulfilled");

  const handleFulfill = async (requestId: number) => {
    setFulfilling(requestId);
    try {
      await fulfillRequest(requestId);
      // Refresh requests after fulfilling
      const updated = await getRequests();
      setRequests(updated);
    } catch (err) {
      alert(err.message || "Failed to fulfill request");
    } finally {
      setFulfilling(null);
    }
  };

  // Form state for new request
  const [form, setForm] = useState({
    HospitalID: '',
    BankID: '',
    RequiredBloodType: '',
    UnitsNeeded: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleCreateRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await (await import("@/lib/apiClient")).createRequest({
        HospitalID: Number(form.HospitalID),
        BankID: Number(form.BankID),
        RequiredBloodType: form.RequiredBloodType,
        UnitsNeeded: Number(form.UnitsNeeded),
      });
      setForm({ HospitalID: '', BankID: '', RequiredBloodType: '', UnitsNeeded: '' });
      // Refresh requests
      const updated = await getRequests();
      setRequests(updated);
    } catch (err) {
      alert(err.message || "Failed to create request");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h2 className="text-3xl font-bold text-foreground">Blood Requests</h2>
        <p className="text-muted-foreground">Manage hospital blood requests</p>
      </div>

      {/* Create Request Form */}
      <Card>
        <CardHeader>
          <CardTitle>Create New Blood Request</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="grid gap-4 md:grid-cols-2" onSubmit={handleCreateRequest}>
            <div>
              <label className="block text-sm font-medium mb-1">Hospital</label>
              <select name="HospitalID" value={form.HospitalID} onChange={handleFormChange} className="w-full border rounded px-2 py-1">
                <option value="">Select Hospital</option>
                {hospitals.map(h => (
                  <option key={h.HospitalID} value={h.HospitalID}>{h.Name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Blood Bank</label>
              <select name="BankID" value={form.BankID} onChange={handleFormChange} className="w-full border rounded px-2 py-1">
                <option value="">Select Blood Bank</option>
                {banks.map(b => (
                  <option key={b.BankID} value={b.BankID}>{b.Name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Blood Type</label>
              <select name="RequiredBloodType" value={form.RequiredBloodType} onChange={handleFormChange} className="w-full border rounded px-2 py-1">
                <option value="">Select Type</option>
                {["A+","A-","B+","B-","AB+","AB-","O+","O-"]
                  .map(type => <option key={type} value={type}>{type}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Units Needed</label>
              <input name="UnitsNeeded" type="number" min={1} value={form.UnitsNeeded} onChange={handleFormChange} className="w-full border rounded px-2 py-1" required />
            </div>
            <div className="md:col-span-2">
              <Button type="submit" disabled={submitting || !form.HospitalID || !form.BankID || !form.RequiredBloodType || !form.UnitsNeeded}>
                {submitting ? "Submitting..." : "Create Request"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pending Requests</p>
                <p className="text-3xl font-bold text-warning">{pendingRequests.length}</p>
              </div>
              <FileText className="h-12 w-12 text-warning" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Fulfilled Requests</p>
                <p className="text-3xl font-bold text-success">{fulfilledRequests.length}</p>
              </div>
              <CheckCircle className="h-12 w-12 text-success" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pending Requests */}
      <Card>
        <CardHeader>
          <CardTitle>Pending Requests</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-8 text-center text-muted-foreground">Loading requests...</div>
          ) : error ? (
            <div className="py-8 text-center text-destructive">{error}</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Request ID</TableHead>
                    <TableHead>Hospital</TableHead>
                    <TableHead>Blood Bank</TableHead>
                    <TableHead>Blood Type</TableHead>
                    <TableHead>Units Needed</TableHead>
                    <TableHead>Request Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingRequests.map((request) => (
                    <TableRow key={request.RequestID}>
                      <TableCell className="font-medium">{request.RequestID}</TableCell>
                      <TableCell>{getHospitalName(request.HospitalID)}</TableCell>
                      <TableCell className="text-sm">{getBankName(request.BankID)}</TableCell>
                      <TableCell>
                        <Badge className={`bg-${getBloodTypeColor(request.RequiredBloodType)}/10 text-${getBloodTypeColor(request.RequiredBloodType)} hover:bg-${getBloodTypeColor(request.RequiredBloodType)}/20`}>
                          {request.RequiredBloodType}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">{request.UnitsNeeded}</TableCell>
                      <TableCell>{request.RequestDate}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="bg-warning/10 text-warning">
                          {request.Status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button size="sm" className="flex items-center gap-1" disabled={fulfilling === request.RequestID} onClick={() => handleFulfill(request.RequestID)}>
                          <CheckCircle className="h-3 w-3" />
                          {fulfilling === request.RequestID ? "Fulfilling..." : "Fulfill"}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Fulfilled Requests */}
      <Card>
        <CardHeader>
          <CardTitle>Fulfilled Requests</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Request ID</TableHead>
                  <TableHead>Hospital</TableHead>
                  <TableHead>Blood Bank</TableHead>
                  <TableHead>Blood Type</TableHead>
                  <TableHead>Units Provided</TableHead>
                  <TableHead>Request Date</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {fulfilledRequests.map((request) => (
                  <TableRow key={request.RequestID}>
                    <TableCell className="font-medium">{request.RequestID}</TableCell>
                    <TableCell>{getHospitalName(request.HospitalID)}</TableCell>
                    <TableCell className="text-sm">{getBankName(request.BankID)}</TableCell>
                    <TableCell>
                      <Badge className={`bg-${getBloodTypeColor(request.RequiredBloodType)}/10 text-${getBloodTypeColor(request.RequiredBloodType)} hover:bg-${getBloodTypeColor(request.RequiredBloodType)}/20`}>
                        {request.RequiredBloodType}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">{request.UnitsNeeded}</TableCell>
                    <TableCell>{request.RequestDate}</TableCell>
                    <TableCell>
                      <Badge className="bg-success/10 text-success">{request.Status}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Database Note */}
      <Card className="border-primary bg-primary/5">
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground">
            <strong>Database Integration:</strong> The "Fulfill" button will trigger the{" "}
            <code className="rounded bg-muted px-1 py-0.5">sp_FulfillBloodRequest</code> stored procedure in your MySQL
            database, which handles the transaction logic including inventory updates and request status changes.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Requests;
