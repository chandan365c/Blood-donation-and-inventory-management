import React, { useEffect, useState } from "react";
import { Hospital as HospitalIcon, MapPin, Activity } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getHospitals, getRequests, createHospital, updateHospital, getHospitalRequestHistory } from "@/lib/apiClient";
import { Hospital, BloodRequest, HospitalRequestHistory, getBloodTypeColor, getStatusColor } from "@/lib/mockData";

const Hospitals = () => {
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [requests, setRequests] = useState<BloodRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    Promise.all([getHospitals(), getRequests()])
      .then(([hospData, reqData]) => {
        setHospitals(hospData);
        setRequests(reqData);
      })
      .catch((err) => setError(err.message || "Failed to fetch hospitals/requests"))
      .finally(() => setLoading(false));
  }, []);

  const [selectedHospital, setSelectedHospital] = useState<Hospital | null>(null);
  const [viewOpen, setViewOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

  const [history, setHistory] = useState<HospitalRequestHistory[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);

  const getHospitalRequests = (hospitalId: number) => {
    return requests.filter((req) => req.HospitalID === hospitalId);
  };

  const getPendingCount = (hospitalId: number) => {
    return getHospitalRequests(hospitalId).filter((req) => req.Status === "Pending").length;
  };

  // Form state for new hospital
  const [form, setForm] = useState({
    Name: '',
    Address: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleCreateHospital = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await createHospital({ ...form });
      setForm({ Name: '', Address: '' });
      // Refresh hospitals
      const updated = await getHospitals();
      setHospitals(updated);
    } catch (err) {
      alert(err.message || "Failed to create hospital");
    } finally {
      setSubmitting(false);
    }
  };

  const openView = (hospital: Hospital) => {
    setSelectedHospital(hospital);
    setViewOpen(true);
    setHistoryLoading(true);
    setHistory([]);
    setHistoryError(null);

    getHospitalRequestHistory(hospital.HospitalID)
      .then((data) => {
        setHistory(data);
      })
      .catch((err) => {
        setHistoryError(err.message || "Failed to fetch request history");
      })
      .finally(() => {
        setHistoryLoading(false);
      });
  };

  const openEdit = (hospital: Hospital) => {
    setSelectedHospital(hospital);
    setForm({ Name: hospital.Name || '', Address: hospital.Address || '' });
    setEditOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedHospital) return;
    setSubmitting(true);
    try {
      await updateHospital(selectedHospital.HospitalID, { ...form });
      const updated = await getHospitals();
      setHospitals(updated);
      setEditOpen(false);
    } catch (err: any) {
      alert(err?.message || "Failed to update hospital");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-foreground">Hospitals</h2>
          <p className="text-muted-foreground">Manage hospital partners</p>
        </div>
      </div>

      {/* Create Hospital Form */}
      <Card>
        <CardHeader>
          <CardTitle>Add New Hospital</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="grid gap-4 md:grid-cols-2" onSubmit={handleCreateHospital}>
            <div>
              <label className="block text-sm font-medium mb-1">Name</label>
              <input name="Name" value={form.Name} onChange={handleFormChange} className="w-full border rounded px-2 py-1" required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Address</label>
              <input name="Address" value={form.Address} onChange={handleFormChange} className="w-full border rounded px-2 py-1" required />
            </div>
            <div className="md:col-span-2">
              <Button type="submit" disabled={submitting || !form.Name || !form.Address}>
                {submitting ? "Submitting..." : "Add Hospital"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Hospitals Grid */}
      {loading ? (
        <div className="py-8 text-center text-muted-foreground">Loading hospitals...</div>
      ) : error ? (
        <div className="py-8 text-center text-destructive">{error}</div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {hospitals.map((hospital) => {
            const totalRequests = getHospitalRequests(hospital.HospitalID).length;
            const pendingRequests = getPendingCount(hospital.HospitalID);

            return (
              <Card key={hospital.HospitalID} className="overflow-hidden transition-all hover:shadow-lg">
                <CardHeader className="bg-accent">
                  <CardTitle className="flex items-center gap-2">
                    <HospitalIcon className="h-5 w-5 text-primary" />
                    {hospital.Name}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 pt-6">
                  <div className="flex items-start gap-2">
                    <MapPin className="mt-1 h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium text-foreground">Address</p>
                      <p className="text-sm text-muted-foreground">{hospital.Address}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2">
                    <Activity className="mt-1 h-4 w-4 text-muted-foreground" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">Request Activity</p>
                      <div className="mt-2 flex gap-4">
                        <div>
                          <p className="text-2xl font-bold text-foreground">{totalRequests}</p>
                          <p className="text-xs text-muted-foreground">Total Requests</p>
                        </div>
                        <div>
                          <p className="text-2xl font-bold text-warning">{pendingRequests}</p>
                          <p className="text-xs text-muted-foreground">Pending</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {pendingRequests > 0 && (
                    <Badge variant="secondary" className="bg-warning/10 text-warning">
                      {pendingRequests} Pending Request{pendingRequests > 1 ? "s" : ""}
                    </Badge>
                  )}

                  <div className="flex gap-2 pt-2">
                    <Button variant="outline" size="sm" className="flex-1" onClick={() => openView(hospital)}>
                        View Details
                      </Button>
                      <Button variant="outline" size="sm" className="flex-1" onClick={() => openEdit(hospital)}>
                        Edit
                      </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Database Note
      <Card className="border-primary bg-primary/5">
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground">
            <strong>Note:</strong> Hospital data is stored in the <code className="rounded bg-muted px-1 py-0.5">Hospitals</code> table.
            Each hospital can submit blood requests that are tracked in the <code className="rounded bg-muted px-1 py-0.5">BloodRequests</code> table.
          </p>
        </CardContent>
      </Card>
      */}

      {/* View Dialog */}
      <Dialog open={viewOpen} onOpenChange={setViewOpen}>
        <DialogContent className="max-w-3xl"> {/* Made dialog wider */}
          <DialogHeader>
            <DialogTitle>Hospital Details</DialogTitle>
            <DialogDescription>{selectedHospital?.Name}</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 pt-2">
            <p><strong>Name:</strong> {selectedHospital?.Name}</p>
            <p><strong>Address:</strong> {selectedHospital?.Address}</p>
          </div>

          <hr className="my-4" />

          {/* History Section */}
          <div className="space-y-2">
            <h4 className="text-lg font-semibold">Request History</h4>
            {historyLoading ? (
              <p className="text-muted-foreground">Loading history...</p>
            ) : historyError ? (
              <p className="text-destructive">{historyError}</p>
            ) : history.length === 0 ? (
              <p className="text-muted-foreground">No request history found for this hospital.</p>
            ) : (
              <div className="max-h-[300px] overflow-y-auto rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Request ID</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Blood Bank</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Units</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {history.map((item) => (
                      <TableRow key={item.RequestID}>
                        <TableCell>{item.RequestID}</TableCell>
                        <TableCell>{new Date(item.RequestDate).toLocaleDateString()}</TableCell>
                        <TableCell>{item.BloodBankName}</TableCell>
                        <TableCell>
                          <Badge
                            className={`bg-${getBloodTypeColor(item.RequiredBloodType)}/10 text-${getBloodTypeColor(
                              item.RequiredBloodType,
                            )} hover:bg-${getBloodTypeColor(item.RequiredBloodType)}/20`}
                          >
                            {item.RequiredBloodType}
                          </Badge>
                        </TableCell>
                        <TableCell>{item.UnitsNeeded}</TableCell>
                        <TableCell>
                          <Badge
                            variant={item.Status === "Pending" ? "secondary" : "default"}
                            className={
                              item.Status === "Pending"
                                ? "bg-warning/10 text-warning"
                                : "bg-success/10 text-success"
                            }
                          >
                            {item.Status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Hospital</DialogTitle>
            <DialogDescription>Edit details and save</DialogDescription>
          </DialogHeader>
          <form className="grid gap-4" onSubmit={handleEditSubmit}>
            <div>
              <label className="block text-sm font-medium mb-1">Name</label>
              <input name="Name" value={form.Name} onChange={(e)=>setForm({...form, Name: e.target.value})} className="w-full border rounded px-2 py-1" required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Address</label>
              <input name="Address" value={form.Address} onChange={(e)=>setForm({...form, Address: e.target.value})} className="w-full border rounded px-2 py-1" required />
            </div>
            <DialogFooter>
              <div className="flex gap-2">
                <Button type="submit" disabled={submitting}>Save</Button>
                <Button variant="ghost" onClick={()=>setEditOpen(false)}>Cancel</Button>
              </div>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Hospitals;
