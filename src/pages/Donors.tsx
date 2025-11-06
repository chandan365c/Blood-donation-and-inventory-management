// ...existing code...
import { Search, UserPlus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useEffect, useState } from "react";
import { getDonors, createDonor } from "@/lib/apiClient";
import { getBloodTypeColor, Donor } from "@/lib/mockData";


const Donors = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [donors, setDonors] = useState<Donor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    getDonors()
      .then((data) => setDonors(data))
      .catch((err) => setError(err.message || "Failed to fetch donors"))
      .finally(() => setLoading(false));
  }, []);

  const filteredDonors = donors.filter(
    (donor) =>
      donor.FirstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      donor.LastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      donor.PhoneNumber.includes(searchTerm) ||
      donor.BloodType.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const isEligible = (lastDonation: string | null) => {
    if (!lastDonation) return true;
    const daysSince = Math.floor(
      (new Date().getTime() - new Date(lastDonation).getTime()) / (1000 * 60 * 60 * 24)
    );
    return daysSince > 56;
  };

  // Form state for new donor
  const [form, setForm] = useState({
    FirstName: '',
    LastName: '',
    BloodType: '',
    PhoneNumber: '',
    Email: '',
    City: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleCreateDonor = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await (await import("@/lib/apiClient")).createDonor({
        ...form,
      });
      setForm({ FirstName: '', LastName: '', BloodType: '', PhoneNumber: '', Email: '', City: '' });
      // Refresh donors
      const updated = await getDonors();
      setDonors(updated);
    } catch (err) {
      alert(err.message || "Failed to create donor");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-foreground">Donors</h2>
          <p className="text-muted-foreground">Manage blood donors</p>
        </div>
      </div>

      {/* Create Donor Form */}
      <Card>
        <CardHeader>
          <CardTitle>Add New Donor</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="grid gap-4 md:grid-cols-2" onSubmit={handleCreateDonor}>
            <div>
              <label className="block text-sm font-medium mb-1">First Name</label>
              <input name="FirstName" value={form.FirstName} onChange={handleFormChange} className="w-full border rounded px-2 py-1" required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Last Name</label>
              <input name="LastName" value={form.LastName} onChange={handleFormChange} className="w-full border rounded px-2 py-1" required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Blood Type</label>
              <select name="BloodType" value={form.BloodType} onChange={handleFormChange} className="w-full border rounded px-2 py-1" required>
                <option value="">Select Type</option>
                {["A+","A-","B+","B-","AB+","AB-","O+","O-"]
                  .map(type => <option key={type} value={type}>{type}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Phone Number</label>
              <input name="PhoneNumber" value={form.PhoneNumber} onChange={handleFormChange} className="w-full border rounded px-2 py-1" required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <input name="Email" type="email" value={form.Email} onChange={handleFormChange} className="w-full border rounded px-2 py-1" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">City</label>
              <input name="City" value={form.City} onChange={handleFormChange} className="w-full border rounded px-2 py-1" />
            </div>
            <div className="md:col-span-2">
              <Button type="submit" disabled={submitting || !form.FirstName || !form.LastName || !form.BloodType || !form.PhoneNumber}>
                {submitting ? "Submitting..." : "Add Donor"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Search Donors</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by name, phone, or blood type..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Donors Table */}
      <Card>
        <CardHeader>
          <CardTitle>Registered Donors ({filteredDonors.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-8 text-center text-muted-foreground">Loading donors...</div>
          ) : error ? (
            <div className="py-8 text-center text-destructive">{error}</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Blood Type</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>City</TableHead>
                    <TableHead>Last Donation</TableHead>
                    <TableHead>Eligibility</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDonors.map((donor) => (
                    <TableRow key={donor.DonorID}>
                      <TableCell className="font-medium">{donor.DonorID}</TableCell>
                      <TableCell>
                        {donor.FirstName} {donor.LastName}
                      </TableCell>
                      <TableCell>
                        <Badge className={`bg-${getBloodTypeColor(donor.BloodType)}/10 text-${getBloodTypeColor(donor.BloodType)} hover:bg-${getBloodTypeColor(donor.BloodType)}/20`}>
                          {donor.BloodType}
                        </Badge>
                      </TableCell>
                      <TableCell>{donor.PhoneNumber}</TableCell>
                      <TableCell>{donor.City}</TableCell>
                      <TableCell>{donor.LastDonationDate ? new Date(donor.LastDonationDate).toLocaleDateString() : "Never"}</TableCell>
                      <TableCell>
                        <Badge variant={isEligible(donor.LastDonationDate) ? "default" : "secondary"}>
                          {isEligible(donor.LastDonationDate) ? "Eligible" : "Ineligible"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Database Connection Note
      <Card className="border-warning bg-warning/5">
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground">
            <strong>Note:</strong> This interface is now connected to your MySQL database via the backend API.
          </p>
        </CardContent>
      </Card>
      */}
    </div>
  );
};

export default Donors;
