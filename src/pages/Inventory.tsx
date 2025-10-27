import { useState } from "react";
import { Package, Filter } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { mockInventory, mockDonors, mockBloodBanks, getBloodTypeColor, getStatusColor } from "@/lib/mockData";

const Inventory = () => {
  const [filterType, setFilterType] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const filteredInventory = mockInventory.filter((item) => {
    const typeMatch = filterType === "all" || item.BloodType === filterType;
    const statusMatch = filterStatus === "all" || item.Status === filterStatus;
    return typeMatch && statusMatch;
  });

  const getDonorName = (donorId: number) => {
    const donor = mockDonors.find((d) => d.DonorID === donorId);
    return donor ? `${donor.FirstName} ${donor.LastName}` : "Unknown";
  };

  const getBankName = (bankId: number) => {
    const bank = mockBloodBanks.find((b) => b.BankID === bankId);
    return bank ? bank.Name : "Unknown";
  };

  const getDaysUntilExpiry = (expiryDate: string) => {
    const days = Math.floor((new Date(expiryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    return days;
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-foreground">Blood Inventory</h2>
          <p className="text-muted-foreground">Track blood units and stock levels</p>
        </div>
        <Button className="flex items-center gap-2">
          <Package className="h-4 w-4" />
          Record Donation
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filter Inventory
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="mb-2 block text-sm font-medium text-foreground">Blood Type</label>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger>
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="A+">A+</SelectItem>
                  <SelectItem value="A-">A-</SelectItem>
                  <SelectItem value="B+">B+</SelectItem>
                  <SelectItem value="B-">B-</SelectItem>
                  <SelectItem value="AB+">AB+</SelectItem>
                  <SelectItem value="AB-">AB-</SelectItem>
                  <SelectItem value="O+">O+</SelectItem>
                  <SelectItem value="O-">O-</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1">
              <label className="mb-2 block text-sm font-medium text-foreground">Status</label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="Available">Available</SelectItem>
                  <SelectItem value="Used">Used</SelectItem>
                  <SelectItem value="Expired">Expired</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Inventory Table */}
      <Card>
        <CardHeader>
          <CardTitle>Blood Units ({filteredInventory.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Bag ID</TableHead>
                  <TableHead>Blood Type</TableHead>
                  <TableHead>Donor</TableHead>
                  <TableHead>Blood Bank</TableHead>
                  <TableHead>Collection Date</TableHead>
                  <TableHead>Expiry Date</TableHead>
                  <TableHead>Days Left</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInventory.map((item) => {
                  const daysLeft = getDaysUntilExpiry(item.ExpiryDate);
                  return (
                    <TableRow key={item.BagID}>
                      <TableCell className="font-medium">{item.BagID}</TableCell>
                      <TableCell>
                        <Badge className={`bg-${getBloodTypeColor(item.BloodType)}/10 text-${getBloodTypeColor(item.BloodType)} hover:bg-${getBloodTypeColor(item.BloodType)}/20`}>
                          {item.BloodType}
                        </Badge>
                      </TableCell>
                      <TableCell>{getDonorName(item.DonorID)}</TableCell>
                      <TableCell className="text-sm">{getBankName(item.BankID)}</TableCell>
                      <TableCell>{item.CollectionDate}</TableCell>
                      <TableCell>{item.ExpiryDate}</TableCell>
                      <TableCell>
                        <span
                          className={`font-medium ${
                            daysLeft < 0
                              ? "text-destructive"
                              : daysLeft < 7
                              ? "text-warning"
                              : "text-success"
                          }`}
                        >
                          {daysLeft < 0 ? "Expired" : `${daysLeft} days`}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge variant={item.Status === "Available" ? "default" : "secondary"}>
                          {item.Status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Inventory;
