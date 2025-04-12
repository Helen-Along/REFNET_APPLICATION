import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from "react-native";
import { supabase } from "~/lib/supabase";
import { WorkflowStatistics } from "~/components/WorkflowStatistics";
import { RepairItem } from "~/components/RepairItem";
import { RepairDetailsModal } from "~/components/RepairDetailsModal";
import { H3, H4 } from "~/components/ui/typography";
import {
  GalleryVertical,
  ListTodo,
  ListChecks,
  MessageCircle,
  GalleryVerticalEnd,
} from "lucide-react-native";
import StatsCard from "~/components/StatsCard";

type Repair = {
  id: number;
  productName: string;
  customerName: string;
  technicianName: string;
  status: "pending" | "inprogress" | "completed";
  estimatedCompletion: string;
  description: string;
  repairNotes: string;
  partsUsed: string[];
};

export default function Page() {
  const [repairs, setRepairs] = useState<Repair[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRepair, setSelectedRepair] = useState<Repair | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [sortBy, setSortBy] = useState("all-repairs");
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchRepairs();
    const subscription = supabase
      .channel("repairs")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "repairs" },
        handleRepairChange
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const fetchRepairs = async () => {
    setIsLoading(true);
    setRefreshing(false);
    setError(null);
    try {
      const { data, error } = await supabase
        .from("repairs")
        .select("*, products:product_id(*), users:technician_id(*)")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setRepairs(data || []);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An unknown error occurred"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleRepairChange = (payload: any) => {
    fetchRepairs();
  };

  const handleViewDetails = (repairId: number) => {
    const repair = repairs.find((r) => r.id === repairId);
    if (repair) {
      setSelectedRepair(repair);
      setIsModalVisible(true);
    }
  };

  const handleApproveRepair = async (repairId: number) => {
    try {
      const { error } = await supabase
        .from("repairs")
        .update({ status: "completed" })
        .eq("id", repairId)

      if (error) throw error;
      console.log(error)

      Alert.alert(
        "Success",
        "Repair has been approved and marked as completed."
      );
      setIsModalVisible(false);
      fetchRepairs();
    } catch (err) {
      Alert.alert(
        "Error",
        err instanceof Error ? err.message : "An unknown error occurred"
      );
    }
  };

  const getSortedRepairs = () => {
    switch (sortBy) {
      case "pending":
        return repairs.filter((repair) => repair.status === "pending");
      case "inprogress":
        return repairs.filter((repair) => repair.status === "inprogress");
      case "completed":
        return repairs.filter((repair) => repair.status === "completed");
      default:
        return repairs;
    }
  };

  const sortedRepairs = getSortedRepairs();

  const pendingApprovalRepairs = repairs.filter((r) => r.status === "pending");
  const inProgressRepairs = repairs.filter((r) => r.status === "assigned");
  const completedToday = repairs.filter((r) => r.status === "completed").length;

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchRepairs();
    setRefreshing(false);
  };

  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-100">
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-100">
        <Text className="text-red-500 text-lg">{error}</Text>
        <TouchableOpacity
          className="mt-4 bg-blue-500 px-4 py-2 rounded-lg"
          onPress={fetchRepairs}
        >
          <Text className="text-white font-bold">Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View className="flex-1">
      <ScrollView
        className="flex-1"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View className="bg-white p-4 gap-6">
          <H3 className="text-black">Statistics</H3>
          <View className="flex-row flex-wrap gap-y-6 justify-between">
            <StatsCard
              iconBgColor="bg-blue-600"
              Icon={<GalleryVertical color="white" size={19} />}
              Title="Total Repairs"
              Description={`${repairs.length} repairs`}
            />
            <StatsCard
              iconBgColor="bg-orange-600"
              Icon={<ListTodo color="white" size={19} />}
              Title="pending"
              Description={`${pendingApprovalRepairs.length} repairs`}
            />
            <StatsCard
              iconBgColor="bg-green-600"
              Icon={<ListChecks color="white" size={19} />}
              Title="inprogress"
              Description={`${inProgressRepairs.length} repairs`}
            />
            <StatsCard
              iconBgColor="bg-purple-600"
              Icon={<MessageCircle color="white" size={19} />}
              Title="completed Today"
              Description={`${completedToday} repairs`}
            />
          </View>
        </View>

        <View className="flex-row p-2 pt-4 justify-between items-center">
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="flex-row gap-2"
          >
            {["all-repairs", "pending", "inprogress", "completed"].map(
              (sort) => (
                <TouchableOpacity
                  key={sort}
                  className={`px-3 pb-2 border-b-2 flex-row items-center ${
                    sortBy === sort ? "border-white" : "border-zinc-900"
                  }`}
                  onPress={() => setSortBy(sort)}
                >
                  {sort === "all-repairs" ? (
                    <GalleryVerticalEnd
                      size={16}
                      color={sortBy === sort ? "#fff" : "#3f3f46"}
                    />
                  ) : sort === "pending" ? (
                    <ListTodo
                      size={16}
                      color={sortBy === sort ? "#fff" : "#3f3f46"}
                    />
                  ) : (
                    <ListChecks
                      size={16}
                      color={sortBy === sort ? "#fff" : "#3f3f46"}
                    />
                  )}
                  <H4
                    className={`capitalize text-lg px-2 ${
                      sortBy === sort ? "text-white" : "text-zinc-700"
                    }`}
                  >
                    {sort.replace("-", " ")}
                  </H4>
                </TouchableOpacity>
              )
            )}
          </ScrollView>
        </View>

        <View className="flex-1 p-4">
          {sortedRepairs.map((repair) => (
            <RepairItem
              key={repair.id}
              repair={repair}
              onViewDetails={handleViewDetails}
            />
          ))}
        </View>
      </ScrollView>

      <RepairDetailsModal
        visible={isModalVisible}
        repair={selectedRepair}
        onClose={() => setIsModalVisible(false)}
        onApprove={handleApproveRepair}
      />
    </View>
  );
};
