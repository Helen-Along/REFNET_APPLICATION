import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Image,
} from "react-native";
import { supabase } from "~/lib/supabase";
import {
  ArrowDownNarrowWide,
  Filter,
  GalleryVerticalEnd,
  CheckCircle,
  XCircle,
  Package,
} from "lucide-react-native";
import { H1, H3, H4, P } from "~/components/ui/typography";
import {
  GalleryVertical,
  ListChecks,
  ListTodo,
  MessageCircle,
} from "lucide-react-native";
import StatsCard from "~/components/StatsCard";
import { Button } from "~/components/ui/button";
import { formatDate } from "~/lib/format-date";
import { formatTime } from "~/lib/format-time";

type RestockItem = {
  id: number;
  product_id: number;
  quantity_needed: number;
  status: "pending" | "accepted" | "rejected" | "completed";
  created_at: string;
  product: {
    id: number;
    name: string;
    description: string;
    image_url: string;
    price: number;
  };
};

export default function Page() {
  const [restockItems, setRestockItems] = useState<RestockItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<
    "All" | "pending" | "accepted" | "rejected" | "completed"
  >("All");
  const skeletons = [0, 1, 2, 3, 4, 5, 6];
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchRestockItems();

    const subscription = supabase
      .channel("restock_requests")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "restock" },
        handleRestockChange
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const fetchRestockItems = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from("restock")
        .select("*, product:product_id(*)")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setRestockItems(data || []);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An unknown error occurred"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleRestockChange = (payload: any) => {
    fetchRestockItems();
  };

  const updateRestockStatus = async (id: number, status: string) => {
    try {
      const { error } = await supabase
        .from("restock")
        .update({ status })
        .eq("id", id);

      if (error) throw error;

      // If marking as accepted, we might also want to update inventory
      if (status === "accepted") {
        // Update the product's stock quantity
        const restockItem = restockItems.find((item) => item.id === id);
        console.log(
          "New Stock Qunatity >> ",
          Number(restockItem.product.stock_quantity) +
            Number(restockItem.stock_amount)
        );
        if (restockItem) {
          const { error: updateError } = await supabase
            .from("products")
            .update({
              stock_quantity:
                Number(restockItem.product.stock_quantity) +
                Number(restockItem.stock_amount),
            })
            .eq("product_id", restockItem.product_id);

          if (updateError) {
            throw updateError;
          }
        }
      }

      Alert.alert("Success", `Restock request ${status} successfully`);
      fetchRestockItems();
    } catch (err) {
      Alert.alert(
        "Error",
        err instanceof Error ? err.message : "An unknown error occurred"
      );
    }
  };

  const filteredRestockItems = restockItems.filter((item) => {
    if (filterStatus === "All") return true;
    return item.status === filterStatus;
  });

  const calculateStats = (items: RestockItem[]) => {
    return [
      {
        iconBgColor: "bg-blue-600",
        Icon: <Package color="white" size={19} />,
        Title: "Total Requests",
        Description: `${items.length} items`,
      },
      {
        iconBgColor: "bg-orange-600",
        Icon: <ListTodo color="white" size={19} />,
        Title: "Pending",
        Description: `${
          items.filter((i) => i.status === "pending").length
        } items`,
      },
      {
        iconBgColor: "bg-green-600",
        Icon: <CheckCircle color="white" size={19} />,
        Title: "Accepted",
        Description: `${
          items.filter((i) => i.status === "accepted").length
        } items`,
      },
      {
        iconBgColor: "bg-purple-600",
        Icon: <MessageCircle color="white" size={19} />,
        Title: "Completed",
        Description: `${
          items.filter((i) => i.status === "completed").length
        } items`,
      },
    ];
  };

  const stats = calculateStats(restockItems);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchRestockItems();
    setRefreshing(false);
  };

  if (error) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-100">
        <Text className="text-red-500 text-lg">{error}</Text>
        <TouchableOpacity
          className="mt-4 bg-blue-500 px-4 py-2 rounded-lg"
          onPress={fetchRestockItems}
        >
          <Text className="text-white font-bold">Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const RestockItemCard = ({ item }: { item: RestockItem }) => {
    return (
      <View className="bg-zinc-900 p-4 rounded-lg">
        <View className="flex-row">
          <Image
            source={{ uri: item.product.image_url }}
            className="w-24 h-24 rounded-md"
            resizeMode="cover"
          />
          <View className="flex-1 ml-4">
            <H3 className="text-white">{item.product.name}</H3>
            <P className="text-gray-400 mt-1 line-clamp-2">
              {item.product.description}
            </P>
            <View className="flex-row items-center mt-2">
              <Text className="text-white font-bold">Quantity needed: </Text>
              <Text className="text-white">{item.stock_amount}</Text>
            </View>
            <View className="flex-row items-center mt-2">
              <Text className="text-white font-bold">Requested on: </Text>
              <Text className="text-white">
                {formatDate(item.created_at)} {formatTime(item.created_at)}
              </Text>
            </View>
            <View className="flex-row items-center mt-1">
              <Text className="text-white font-bold">Status: </Text>
              <Text
                className={`capitalize ${
                  item.status === "accepted"
                    ? "text-green-500"
                    : item.status === "rejected"
                    ? "text-red-500"
                    : item.status === "completed"
                    ? "text-blue-500"
                    : "text-yellow-500"
                }`}
              >
                {item.status}
              </Text>
            </View>
          </View>
        </View>

        <View className="flex-row justify-end mt-4 gap-2">
          {item.status === "pending" && (
            <>
              <TouchableOpacity
                className="bg-green-600 py-2 px-4 rounded-lg flex-row items-center"
                onPress={() => updateRestockStatus(item.id, "accepted")}
              >
                <CheckCircle size={16} color="white" />
                <Text className="text-white ml-2">Accept</Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="bg-red-600 py-2 px-4 rounded-lg flex-row items-center"
                onPress={() => updateRestockStatus(item.id, "rejected")}
              >
                <XCircle size={16} color="white" />
                <Text className="text-white ml-2">Reject</Text>
              </TouchableOpacity>
            </>
          )}

          {item.status === "accepted" && (
            <TouchableOpacity
              className="bg-blue-600 py-2 px-4 rounded-lg flex-row items-center"
              onPress={() => updateRestockStatus(item.id, "completed")}
            >
              <CheckCircle size={16} color="white" />
              <Text className="text-white ml-2">Mark Complete</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  return (
    <View className="flex-1">
      <ScrollView
        className="flex-1"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View className="bg-white p-4 gap-6">
          <H3 className="text-black">Restock Statistics</H3>
          <View className="flex-row flex-wrap gap-y-6 justify-between">
            {stats.map((stat, index) => (
              <StatsCard
                key={index}
                iconBgColor={stat.iconBgColor}
                Icon={stat.Icon}
                Title={stat.Title}
                Description={stat.Description}
              />
            ))}
          </View>
        </View>

        <View className="py-6 px-4">
          <View className="flex-row justify-between items-center">
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              className="flex-row gap-2"
            >
              {(
                ["All", "pending", "accepted", "rejected", "completed"] as const
              ).map((status, index) => (
                <TouchableOpacity
                  key={status}
                  className={`px-3 pb-2 border-b-2 flex-row items-center ${
                    filterStatus === status ? "border-white" : "border-zinc-900"
                  }`}
                  onPress={() => setFilterStatus(status)}
                >
                  {status === "All" ? (
                    <GalleryVerticalEnd
                      size={16}
                      color={filterStatus === status ? "#fff" : "#3f3f46"}
                    />
                  ) : status === "pending" ? (
                    <ListTodo
                      size={16}
                      color={filterStatus === status ? "#fff" : "#3f3f46"}
                    />
                  ) : status === "accepted" ? (
                    <CheckCircle
                      size={16}
                      color={filterStatus === status ? "#fff" : "#3f3f46"}
                    />
                  ) : status === "rejected" ? (
                    <XCircle
                      size={16}
                      color={filterStatus === status ? "#fff" : "#3f3f46"}
                    />
                  ) : (
                    <ListChecks
                      size={16}
                      color={filterStatus === status ? "#fff" : "#3f3f46"}
                    />
                  )}
                  <H4
                    className={`capitalize text-lg px-2 ${
                      filterStatus === status ? "text-white" : "text-zinc-700"
                    }`}
                  >
                    {status === "All" ? "All Requests" : status}
                  </H4>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>

        <View className="flex-1 p-4">
          <View className="gap-4">
            {isLoading ? (
              skeletons.map((skeleton, index) => (
                <View
                  className="w-full h-32 bg-zinc-900 animate-pulse rounded-lg"
                  key={index}
                />
              ))
            ) : filteredRestockItems.length === 0 ? (
              <View className="p-4">
                <H1 className="text-white !text-[40px]">
                  No results {"\n"}Found
                </H1>
              </View>
            ) : (
              filteredRestockItems.map((item, index) => (
                <RestockItemCard key={index} item={item} />
              ))
            )}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
