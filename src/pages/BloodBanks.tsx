import { Building2, MapPin, Phone } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { mockBloodBanks } from "@/lib/mockData";

const BloodBanks = () => {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-foreground">Blood Banks</h2>
          <p className="text-muted-foreground">Manage blood bank centers</p>
        </div>
        <Button className="flex items-center gap-2">
          <Building2 className="h-4 w-4" />
          Add Blood Bank
        </Button>
      </div>

      {/* Blood Banks Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {mockBloodBanks.map((bank) => (
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
