import { Hospital as HospitalIcon, MapPin, Activity } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { mockHospitals, mockRequests } from "@/lib/mockData";

const Hospitals = () => {
  const getHospitalRequests = (hospitalId: number) => {
    return mockRequests.filter((req) => req.HospitalID === hospitalId);
  };

  const getPendingCount = (hospitalId: number) => {
    return getHospitalRequests(hospitalId).filter((req) => req.Status === "Pending").length;
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-foreground">Hospitals</h2>
          <p className="text-muted-foreground">Manage hospital partners</p>
        </div>
        <Button className="flex items-center gap-2">
          <HospitalIcon className="h-4 w-4" />
          Add Hospital
        </Button>
      </div>

      {/* Hospitals Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {mockHospitals.map((hospital) => {
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
                  <Button variant="outline" size="sm" className="flex-1">
                    View Requests
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1">
                    Edit
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Database Note */}
      <Card className="border-primary bg-primary/5">
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground">
            <strong>Note:</strong> Hospital data is stored in the <code className="rounded bg-muted px-1 py-0.5">Hospitals</code> table.
            Each hospital can submit blood requests that are tracked in the <code className="rounded bg-muted px-1 py-0.5">BloodRequests</code> table.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Hospitals;
