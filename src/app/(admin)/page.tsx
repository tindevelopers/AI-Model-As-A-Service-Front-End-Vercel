'use client'

import { useAuth } from "@/context/AuthContext";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import GatewayConnectionTest from "@/components/gateway/GatewayConnectionTest";
import { EcommerceMetrics } from "@/components/ecommerce/EcommerceMetrics";
import React from "react";
import MonthlyTarget from "@/components/ecommerce/MonthlyTarget";
import MonthlySalesChart from "@/components/ecommerce/MonthlySalesChart";
import StatisticsChart from "@/components/ecommerce/StatisticsChart";
import RecentOrders from "@/components/ecommerce/RecentOrders";
import DemographicCard from "@/components/ecommerce/DemographicCard";

export default function Dashboard() {
  const { user } = useAuth();

  return (
    <ProtectedRoute>
      <div className="grid grid-cols-12 gap-4 md:gap-6">
        {/* Welcome Message */}
        <div className="col-span-12">
          <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/3">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Welcome back, {user?.user_metadata?.full_name || user?.email}!
            </h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Manage your AI models, API keys, and monitor usage from your dashboard.
            </p>
          </div>
        </div>

        {/* Gateway Connection Test */}
        <div className="col-span-12">
          <GatewayConnectionTest />
        </div>

        <div className="col-span-12 space-y-6 xl:col-span-7">
          <EcommerceMetrics />
          <MonthlySalesChart />
        </div>

        <div className="col-span-12 xl:col-span-5">
          <MonthlyTarget />
        </div>

        <div className="col-span-12">
          <StatisticsChart />
        </div>

        <div className="col-span-12 xl:col-span-5">
          <DemographicCard />
        </div>

        <div className="col-span-12 xl:col-span-7">
          <RecentOrders />
        </div>
      </div>
    </ProtectedRoute>
  );
}
