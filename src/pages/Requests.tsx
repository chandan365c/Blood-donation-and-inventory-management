import { FileText, CheckCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { mockRequests, mockHospitals, mockBloodBanks, getBloodTypeColor } from "@/lib/mockData";

const Requests = () => {
  const getHospitalName = (hospitalId: number) => {
    const hospital = mockHospitals.find((h) => h.HospitalID === hospitalId);
    return hospital ? hospital.Name : "Unknown";
  };

  const getBankName = (bankId: number) => {
    const bank = mockBloodBanks.find((b) => b.BankID === bankId);
    return bank ? bank.Name : "Unknown";
  };

  const pendingRequests = mockRequests.filter((req) => req.Status === "Pending");
  const fulfilledRequests = mockRequests.filter((req) => req.Status === "Fulfilled");

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h2 className="text-3xl font-bold text-foreground">Blood Requests</h2>
        <p className="text-muted-foreground">Manage hospital blood requests</p>
      </div>

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
                      <Button size="sm" className="flex items-center gap-1">
                        <CheckCircle className="h-3 w-3" />
                        Fulfill
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
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
