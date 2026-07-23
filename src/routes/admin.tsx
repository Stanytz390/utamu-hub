import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Toaster, toast } from "sonner";

// ============================================
// Route definition with beforeLoad
// ============================================
export const Route = createFileRoute("/admin")({
  beforeLoad: async ({ location }) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error("Please log in first.");
    }

    const adminEmail = import.meta.env.VITE_ADMIN_EMAIL;
    const isAdminEmail = adminEmail && user.email === adminEmail;

    // Fetch or create profile
    let { data: profile, error } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    if (error) {
      console.error("Profile fetch error:", error);
      throw new Error("Could not fetch user profile");
    }

    // If no profile exists, create one
    if (!profile) {
      const { error: insertError } = await supabase
        .from("profiles")
        .insert({
          id: user.id,
          email: user.email,
          full_name: user.user_metadata?.username || user.email?.split("@")[0] || "User",
          role: isAdminEmail ? "admin" : "user",
        });
      if (insertError) {
        console.error("Profile creation error:", insertError);
        throw new Error("Could not create user profile");
      }
      // Re‑fetch to get the role
      const { data: newProfile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();
      profile = newProfile;
    }

    // If user is admin email but role is not admin, promote
    if (isAdminEmail && profile?.role !== "admin") {
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ role: "admin" })
        .eq("id", user.id);
      if (updateError) {
        console.error("Admin promotion error:", updateError);
        throw new Error("Could not promote to admin");
      }
      profile.role = "admin";
    }

    // Check if user has admin role
    if (profile?.role !== "admin") {
      throw new Error("You do not have admin access.");
    }

    return { user, profile };
  },
  component: AdminDashboard,
});

// ============================================
// Admin Dashboard Component
// ============================================
function AdminDashboard() {
  const navigate = useNavigate();
  const { user, profile } = Route.useRouteContext(); // or useLoaderData? Actually we'll use useRouteContext

  // If we didn't pass context, we can fetch it again, but we'll use the route's loaderData if available.
  // Better: use the beforeLoad's return as context via `useRouteContext` after defining it.

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <Toaster position="top-right" richColors />
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">{user?.email}</span>
            <button
              onClick={async () => {
                await supabase.auth.signOut();
                navigate({ to: "/auth" });
              }}
              className="text-sm text-red-600 hover:underline"
            >
              Sign Out
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <StatCard title="Users" value="1,234" icon="fa-users" color="blue" />
          <StatCard title="Videos" value="56" icon="fa-video" color="purple" />
          <StatCard title="Groups" value="12" icon="fa-users-cog" color="green" />
          <StatCard title="Coins" value="10,567" icon="fa-coins" color="gold" />
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border">
          <h2 className="text-xl font-bold mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link to="/admin/videos" className="p-4 bg-purple-50 rounded-lg text-center hover:bg-purple-100">
              <i className="fas fa-video text-2xl text-purple-600"></i>
              <p className="text-sm mt-1">Manage Videos</p>
            </Link>
            <Link to="/admin/users" className="p-4 bg-blue-50 rounded-lg text-center hover:bg-blue-100">
              <i className="fas fa-users text-2xl text-blue-600"></i>
              <p className="text-sm mt-1">Manage Users</p>
            </Link>
            <Link to="/admin/groups" className="p-4 bg-green-50 rounded-lg text-center hover:bg-green-100">
              <i className="fas fa-users-cog text-2xl text-green-600"></i>
              <p className="text-sm mt-1">Manage Groups</p>
            </Link>
            <Link to="/admin/settings" className="p-4 bg-yellow-50 rounded-lg text-center hover:bg-yellow-100">
              <i className="fas fa-cog text-2xl text-yellow-600"></i>
              <p className="text-sm mt-1">Settings</p>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================
// StatCard Component
// ============================================
function StatCard({ title, value, icon, color }) {
  const colors = {
    blue: "bg-blue-50 text-blue-600",
    purple: "bg-purple-50 text-purple-600",
    green: "bg-green-50 text-green-600",
    gold: "bg-yellow-50 text-yellow-600",
  };
  return (
    <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${colors[color]}`}>
        <i className={`fas ${icon} w-4 text-center`}></i>
      </div>
      <p className="text-2xl font-bold mt-2">{value}</p>
      <p className="text-sm text-gray-500">{title}</p>
    </div>
  );
}

// ============================================
// Error Boundary for the route (if needed)
// ============================================
// If the beforeLoad throws, TanStack Router will show a default error component.
// You can customize it by adding an errorComponent to the route.
// For simplicity, we'll just let it throw and the router will handle it.