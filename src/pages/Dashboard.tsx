import { Users, Package, FileText, AlertCircle, Activity, TrendingUp } from "lucide-react";
import StatCard from "@/components/StatCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useEffect, useState } from "react";
import { getDonors, getInventory, getRequests } from "@/lib/apiClient";
import { Donor, BloodInventory, BloodRequest, getBloodTypeColor } from "@/lib/mockData";

const Dashboard = () => {
  // Calculate statistics
  const [donors, setDonors] = useState<Donor[]>([]);
  const [inventory, setInventory] = useState<BloodInventory[]>([]);
  const [requests, setRequests] = useState<BloodRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    Promise.all([getDonors(), getInventory(), getRequests()])
      .then(([donorData, invData, reqData]) => {
        setDonors(donorData);
        setInventory(invData);
        setRequests(reqData);
      })
      .catch((err) => setError(err.message || "Failed to fetch dashboard data"))
      .finally(() => setLoading(false));
  }, []);

  const totalDonors = donors.length;
  const availableUnits = inventory.filter((item) => item.Status === "Available").length;
  const pendingRequests = requests.filter((req) => req.Status === "Pending").length;
  const recentDonations = donors.filter((d) => d.LastDonationDate).length;

  // Blood type availability
  const bloodTypes = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
  const bloodTypeStats = bloodTypes.map((type) => ({
    type,
    count: inventory.filter((item) => item.BloodType === type && item.Status === "Available").length,
  }));

  // Recent activities (placeholder, can be replaced with real data)
  const recentActivities = [
    { type: "donation", donor: "John Doe", bloodType: "O+", time: "2 hours ago" },
    { type: "request", hospital: "General Hospital", bloodType: "A+", units: 3, time: "4 hours ago" },
    { type: "donation", donor: "Jane Smith", bloodType: "A+", time: "6 hours ago" },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h2 className="text-3xl font-bold text-foreground">Dashboard</h2>
        <p className="text-muted-foreground">Overview of blood bank operations</p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Donors"
          value={totalDonors}
          icon={Users}
          description="Registered donors"
          //trend="+12% from last month"
          color="primary"
        />
        <StatCard
          title="Available Units"
          value={availableUnits}
          icon={Package}
          description="Blood units in stock"
          color="success"
        />
        <StatCard
          title="Pending Requests"
          value={pendingRequests}
          icon={FileText}
          description="Awaiting fulfillment"
          color="warning"
        />
        <StatCard
          title="Recent Donations"
          value={recentDonations}
          icon={Activity}
          description="Last 30 days"
          color="primary"
        />
      </div>

      {/* Blood Type Availability */}
      <Card>
        <CardHeader>
          <CardTitle>Blood Type Availability</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            {bloodTypeStats.map((stat) => (
              <div key={stat.type} className="flex items-center justify-between rounded-lg border p-4">
                <div>
                  <p className="text-2xl font-bold text-foreground">{stat.type}</p>
                  <p className="text-sm text-muted-foreground">Blood Type</p>
                </div>
                <div className="text-right">
                  <p className={`text-2xl font-bold text-${getBloodTypeColor(stat.type)}`}>{stat.count}</p>
                  <p className="text-xs text-muted-foreground">units</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Recent Activities 
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Recent Activities
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivities.map((activity, index) => (
                <div key={index} className="flex items-center justify-between border-b pb-3 last:border-0">
                  <div className="flex items-center gap-3">
                    <Badge variant={activity.type === "donation" ? "default" : "secondary"}>
                      {activity.type === "donation" ? "Donation" : "Request"}
                    </Badge>
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {"donor" in activity ? activity.donor : activity.hospital}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {activity.bloodType} {"units" in activity && `- ${activity.units} units`}
                      </p>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">{activity.time}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Alerts
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-warning" />
              Alerts & Notifications
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex gap-3 rounded-lg bg-destructive/10 p-3">
                <AlertCircle className="h-5 w-5 text-destructive" />
                <div>
                  <p className="text-sm font-medium text-foreground">Low Stock Alert</p>
                  <p className="text-xs text-muted-foreground">O- blood type is running low (3 units)</p>
                </div>
              </div>
              <div className="flex gap-3 rounded-lg bg-warning/10 p-3">
                <AlertCircle className="h-5 w-5 text-warning" />
                <div>
                  <p className="text-sm font-medium text-foreground">Expiring Soon</p>
                  <p className="text-xs text-muted-foreground">2 units expiring within 7 days</p>
                </div>
              </div>
              <div className="flex gap-3 rounded-lg bg-primary/10 p-3">
                <Activity className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm font-medium text-foreground">Urgent Request</p>
                  <p className="text-xs text-muted-foreground">General Hospital needs 5 units of O-</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        */}
      </div>
    </div>
  );
};

export default Dashboard;
