import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Alert,
  RefreshControl,
} from "react-native";
import { checkUser, supabase } from "~/lib/supabase";
import { DispatchCard } from "~/components/DispatchCard";
import { DispatchDetailsModal } from "~/components/DispatchDetailsModal";
import {
  GalleryVertical,
  ListChecks,
  ListTodo,
  MessageCircle,
  Search,
  SearchIcon,
} from "lucide-react-native";
import { useEmail } from "../EmailContext";
import { H3 } from "~/components/ui/typography";
import StatsCard from "~/components/StatsCard";
import { Input } from "~/components/ui/input";
import { P } from "~/components/ui/typography";
import { Button } from "~/components/ui/button";
import { DispatchDetails } from "~/components/sheets/dispatchDetails";

type DispatchStatus = "Pending" | "In Transit" | "Delivered";

type Order = {
  order_id: number;
  product_id: number;
  // ... other order fields
};

type Product = {
  product_id: number;
  name: string;
  description: string;
  // ... other product fields
};

type Dispatch = {
  order_id: number;
  user_id: number;
  dispatch_date: string;
  status: string;
  delivery_address: string;
  tracking_number: string;
  created_at: string;
  driver_id: number;
  order: Order;
  order_details: {
    product: Product;
  };
};

const DISPATCHES_PER_PAGE = 6;

export default function Page() {
  const [dispatches, setDispatches] = useState<Dispatch[]>([]);
  const [filteredDispatches, setFilteredDispatches] = useState<Dispatch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDispatch, setSelectedDispatch] = useState<Dispatch | null>(
    null
  );
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [customer, setCustomerDetails] = useState([]);
  const emailContext = useEmail();
  const [currentPage, setCurrentPage] = useState(1);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchDispatches();
    const subscription = supabase
      .channel("dispatches")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "dispatches" },
        handleDispatchChange
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    async function fetchUserDetails() {
      const response = await checkUser(emailContext?.email);
      if (response) {
        setCustomerDetails(response);
      }
    }
    fetchUserDetails();
    const filtered = dispatches.filter((dispatch) => {
      return true;
    });
    setFilteredDispatches(filtered);
  }, [searchQuery, dispatches, emailContext?.email]);

  const fetchDispatches = async () => {
    setIsLoading(true);
    setError(null);
    const user = await checkUser(emailContext?.email);
    if (!user) {
      setError("User not found");
      setIsLoading(false);
      return;
    }
    const { data, error } = await supabase
      .from("dispatches")
      .select(
        `
    *,
    order:orders (
      *,
      product:products(*)
    )
  `
      )
      .eq("driver_id", user.user_id)
      .order("created_at", { ascending: false });

    if (error) {
      setError(error.message);
      setIsLoading(false);
      return;
    }
    setDispatches(data || []);
    console.log("Dispatch Data: ", JSON.stringify(data, null, 2));
    setFilteredDispatches(data || []);
    setIsLoading(false);
  };

  const handleDispatchChange = (payload: any) => {
    fetchDispatches();
  };

  const handleViewDetails = (orderId: number) => {
    const dispatch = dispatches.find((d) => d.order_id === orderId);
    if (dispatch) {
      setSelectedDispatch(dispatch);
      setIsModalVisible(true);
    }
  };

  const paginatedDispatches = filteredDispatches.slice(
    (currentPage - 1) * DISPATCHES_PER_PAGE,
    currentPage * DISPATCHES_PER_PAGE
  );

  const totalPages = Math.ceil(filteredDispatches.length / DISPATCHES_PER_PAGE);

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const calculateStats = () => {
    const totalAssignments = filteredDispatches.length;
    const pending = filteredDispatches.filter(
      (d) => d.status === "Pending"
    ).length;
    const delivered = filteredDispatches.filter(
      (d) => d.status === "Delivered"
    ).length;
    const inTransit = filteredDispatches.filter(
      (d) => d.status === "In Transit"
    ).length;

    return [
      {
        iconBgColor: "bg-blue-600",
        Icon: <GalleryVertical color="white" size={19} />,
        Title: "Assignments",
        Description: `${totalAssignments} total`,
      },
      {
        iconBgColor: "bg-orange-600",
        Icon: <ListTodo color="white" size={19} />,
        Title: "Pending",
        Description: `${pending} dispatches`,
      },
      {
        iconBgColor: "bg-green-600",
        Icon: <ListChecks color="white" size={19} />,
        Title: "Delivered",
        Description: `${delivered} dispatches`,
      },
      {
        iconBgColor: "bg-purple-600",
        Icon: <MessageCircle color="white" size={19} />,
        Title: "In Transit",
        Description: `${inTransit} dispatches`,
      },
    ];
  };

  const stats = calculateStats();

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchDispatches();
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
          onPress={fetchDispatches}
        >
          <Text className="text-white font-bold">Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView
      className="flex-1"
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View className="bg-white p-4 gap-6">
        <H3 className="text-black">Statistics</H3>
        <View className="flex-row flex-wrap gap-y-6 justify-between">
          {stats.map((stat) => (
            <StatsCard
              key={stat.Title}
              iconBgColor={stat.iconBgColor}
              Icon={stat.Icon}
              Title={stat.Title}
              Description={stat.Description}
            />
          ))}
        </View>
      </View>
      <View className="p-6">
        <View className="flex-row items-center rounded-lg py-2">
          <SearchIcon color={"white"} size={18} />
          <Input
            className="flex-1 text-base border-0"
            placeholder="Search for assignments"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      <ScrollView className="flex-1 p-4">
        <H3 className="text-xl mb-4">Assignments</H3>
        {paginatedDispatches.map((dispatch) => (
          <DispatchCard
            key={dispatch.order_id}
            dispatch={dispatch}
            onViewDetails={handleViewDetails}
          />
        ))}

        <View className="flex-row items-center justify-between my-4">
          <Button
            className="bg-[#111] rounded-full px-4 py-2 disabled:bg-zinc-900"
            onPress={handlePreviousPage}
            disabled={currentPage === 1}
          >
            <P className="text-white">&larr; Previous</P>
          </Button>

          <P className="text-white mx-4">
            Page {currentPage} of {totalPages}
          </P>

          <Button
            className="bg-[#111] rounded-full px-4 py-2 disabled:bg-zinc-900"
            onPress={handleNextPage}
            disabled={currentPage === totalPages}
          >
            <P className="text-white">Next &rarr;</P>
          </Button>
        </View>
      </ScrollView>
    </ScrollView>
  );
};
