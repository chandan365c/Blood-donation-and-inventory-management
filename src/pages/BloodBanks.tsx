import { Building2, MapPin, Phone } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { getBloodBanks } from "@/lib/apiClient";
import { BloodBank } from "@/lib/mockData";

const BloodBanks = () => {
  const [banks, setBanks] = useState<BloodBank[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    getBloodBanks()
      .then((data) => setBanks(data))
      .catch((err) => setError(err.message || "Failed to fetch blood banks"))
      .finally(() => setLoading(false));
  }, []);

  // Form state for new blood bank
  const [form, setForm] = useState({
    Name: '',
    Address: '',
    ContactPerson: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleCreateBank = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await (await import("@/lib/apiClient")).createBloodBank({
        ...form,
      });
      setForm({ Name: '', Address: '', ContactPerson: '' });
      // Refresh banks
      const updated = await getBloodBanks();
      setBanks(updated);
    } catch (err) {
      alert(err.message || "Failed to create blood bank");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-foreground">Blood Banks</h2>
          <p className="text-muted-foreground">Manage blood bank centers</p>
        </div>
      </div>

      {/* Create Blood Bank Form */}
      <Card>
        <CardHeader>
          <CardTitle>Add New Blood Bank</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="grid gap-4 md:grid-cols-2" onSubmit={handleCreateBank}>
            <div>
              <label className="block text-sm font-medium mb-1">Name</label>
              <input name="Name" value={form.Name} onChange={handleFormChange} className="w-full border rounded px-2 py-1" required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Address</label>
              <input name="Address" value={form.Address} onChange={handleFormChange} className="w-full border rounded px-2 py-1" required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Contact Person</label>
              <input name="ContactPerson" value={form.ContactPerson} onChange={handleFormChange} className="w-full border rounded px-2 py-1" />
            </div>
            <div className="md:col-span-2">
              <Button type="submit" disabled={submitting || !form.Name || !form.Address}>
                {submitting ? "Submitting..." : "Add Blood Bank"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Blood Banks Grid */}
      {loading ? (
        <div className="py-8 text-center text-muted-foreground">Loading blood banks...</div>
      ) : error ? (
        <div className="py-8 text-center text-destructive">{error}</div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {banks.map((bank) => (
            <Card key={bank.BankID} className="overflow-hidden transition-all hover:shadow-lg">
              <CardHeader className="bg-primary/5">
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-primary" />
                  {bank.Name}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 pt-6">
                <div className="flex items-start gap-2">
                  <MapPin className="mt-1 h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium text-foreground">Address</p>
                    <p className="text-sm text-muted-foreground">{bank.Address}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Phone className="mt-1 h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium text-foreground">Contact Person</p>
                    <p className="text-sm text-muted-foreground">{bank.ContactPerson}</p>
                  </div>
                </div>
                <div className="flex gap-2 pt-2">
                  <Button variant="outline" size="sm" className="flex-1">
                    View Details
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1">
                    Edit
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Database Note */}
      <Card className="border-primary bg-primary/5">
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground">
            <strong>Note:</strong> Blood bank data is stored in the <code className="rounded bg-muted px-1 py-0.5">BloodBanks</code> table.
            Each blood bank is linked to inventory and requests through foreign keys.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default BloodBanks;
