import { useState } from "react";
import { Search, UserPlus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { mockDonors, getBloodTypeColor } from "@/lib/mockData";

const Donors = () => {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredDonors = mockDonors.filter(
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

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-foreground">Donors</h2>
          <p className="text-muted-foreground">Manage blood donors</p>
        </div>
        <Button className="flex items-center gap-2">
          <UserPlus className="h-4 w-4" />
          Add New Donor
        </Button>
      </div>

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
                    <TableCell>{donor.LastDonationDate || "Never"}</TableCell>
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
        </CardContent>
      </Card>

      {/* Database Connection Note */}
      <Card className="border-warning bg-warning/5">
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground">
            <strong>Note:</strong> This interface uses mock data. Connect to your MySQL database to manage real donor
            records. Update the <code className="rounded bg-muted px-1 py-0.5">executeSQLQuery</code> function in{" "}
            <code className="rounded bg-muted px-1 py-0.5">src/lib/mockData.ts</code> to enable database connectivity.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Donors;
