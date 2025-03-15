import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Image,
  RefreshControl,
} from "react-native";
import {
  ArrowLeft,
  BedDoubleIcon,
  Check,
  CircleDollarSign,
  HandCoins,
  Truck,
  Clock,
  GalleryVerticalEnd,
  ListTodo,
  ListChecks,
} from "lucide-react-native";
import {
  fetchOrders,
  fetchDrivers,
  checkUser,
  fetchDispatchedByOrderId,
  fetchDriverById,
  fetchDeliveredProductIds,
  fetchDispatches,
} from "~/lib/supabase";
import { H1, H2, H3, H4, H5, P } from "~/components/ui/typography";
import { Button } from "~/components/ui/button";
import { useEmail } from "~/app/EmailContext";
import { Card, CardContent, CardHeader } from "~/components/ui/card";
import StatsCard from "~/components/StatsCard";
import { formatDate } from "~/lib/format-date";
import { formatTime } from "~/lib/format-time";
import { AssignDriverModal } from "~/components/sheets/assignDriver";

type Order = {
  id: string;
  status: string;
  driver_id: string;
  driver?: {
    full_name: string;
  };
  // ... other fields
};

export default function Page({ navigation }: { navigation: any }) {
  const emailContext = useEmail();
  const [orders, setOrders] = useState<Order[]>([]);
  const [sortBy, setSortBy] = useState("all-orders");
  const [availableDrivers, setAvailableDrivers] = useState([]);
  const [customer, setCustomerDetails] = useState([]);
  const [driverNames, setDriverNames] = useState<{ [key: string]: string }>({});
  const [sortedOrders, setSortedOrders] = useState<Order[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    async function fetchCustomerOrders() {
      const response = await fetchDispatches();
      console.log("Dispatches product data :)", response.order);
      setOrders(response);
    }
    async function fetchAvailableDrivers() {
      const response = await fetchDrivers();
      setAvailableDrivers(response);
    }
    async function fetchUserDetails() {
      const response = await checkUser(emailContext?.email);
      setCustomerDetails(response);
    }
    fetchUserDetails();
    fetchCustomerOrders();
    fetchAvailableDrivers();
  }, []);

  const stats = [
    {
      iconBgColor: "bg-blue-600",
      Icon: <Truck color="white" size={19} />,
      Title: "Total Orders",
      Description: `${orders.length} orders`,
    },
    {
      iconBgColor: "bg-orange-600",
      Icon: <HandCoins color="white" size={19} />,
      Title: "Available Drivers",
      Description: `${availableDrivers.length} drivers`,
    },
    {
      iconBgColor: "bg-green-600",
      Icon: <CircleDollarSign color="white" size={19} />,
      Title: "Dispatched Drivers",
      Description: `${
        orders.filter((order) => order.status === "assigned").length
      } drivers`,
    },
  ];

  const getSortedOrders = async () => {
    switch (sortBy) {
      case "dispatched":
        return orders.filter((order) => order.status === "dispatched");
      case "pending":
        return orders.filter((order) => order.status === "pending");
      case "assigned":
        return orders.filter((order) => order.status === "assigned");
      case "delivered":
        const deliveredProductIds = await fetchDeliveredProductIds();
        console.log("Delivered Products: ", deliveredProductIds);
        const deliveredOrders = orders.filter((order) =>
          deliveredProductIds.includes(order.order_id)
        );
        setSortedOrders(deliveredOrders);
        return deliveredOrders;
      default:
        return orders;
    }
  };

  const fetchDriverName = async (orderId: number) => {
    // Fetch driver_id from dispatched table using orderId
    const dispatchedResponse = await fetchDispatchedByOrderId(orderId);
    const driverId = dispatchedResponse.driver_id;

    // Fetch driver's full_name from users table using driverId
    const driverResponse = await fetchDriverById(driverId);
    return driverResponse.full_name || "Unknown Driver";
  };

  // Fetch driver names for dispatched orders
  useEffect(() => {
    const fetchDriversForOrders = async () => {
      const dispatchedOrders = orders.filter(
        (order) => order.status === "dispatched"
      );
      for (const order of dispatchedOrders) {
        const driverName = await fetchDriverName(order.order_id);
        setDriverNames((prev) => ({ ...prev, [order.id]: driverName }));
      }
    };

    fetchDriversForOrders();
  }, [orders]); // Run this effect when orders change

  // Fetch sorted orders when the component mounts or when orders or sortBy changes
  useEffect(() => {
    const fetchSortedOrders = async () => {
      const orders = await getSortedOrders(); // Call the async function
      setSortedOrders(orders); // Update state with the fetched orders
    };

    fetchSortedOrders();
  }, [orders, sortBy]); // Dependencies to re-fetch when orders or sortBy changes

  const fetchCustomerOrders = async () => {
    const response = await fetchDispatches();
    console.log("Dispatches product data :)", response.order);
    setOrders(response);
  };

  // Function to handle refresh
  const onRefresh = async () => {
    setRefreshing(true);
    await fetchCustomerOrders(); // Refetch orders
    setRefreshing(false);
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
          <H3 className="text-black">Statistics</H3>
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
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View className="flex-row justify-between items-center gap-2">
              {[
                "all-orders",
                "dispatched",
                "pending",
                "assigned",
                "delivered",
              ].map((sort, index) => (
                <TouchableOpacity
                  key={index}
                  className={`px-3 pb-2 border-b-2 flex-row items-center ${
                    sortBy === sort ? "border-white" : "border-zinc-900"
                  }`}
                  onPress={() => setSortBy(sort)}
                >
                  {sort === "all-orders" ? (
                    <GalleryVerticalEnd
                      size={16}
                      color={sortBy === sort ? "#fff" : "#3f3f46"}
                    />
                  ) : sort === "dispatched" ? (
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
              ))}
            </View>
          </ScrollView>
        </View>

        <View className="flex-1 p-4">
          <View className="gap-4">
            <FlatList
              data={sortedOrders}
              keyExtractor={(item) => item.id}
              ItemSeparatorComponent={() => <View style={{ height: 20 }} />}
              renderItem={({ item }) => (
                <View className="bg-white rounded-lg shadow-sm p-4">
                  <View className="w-full relative overflow-clip">
                    {/* Status Badge */}
                    <View className="flex items-start absolute right-[-14px] top-[-14px]">
                      <View
                        className={`p-2 px-4 rounded-bl-lg rounded-tr-lg flex-row items-center w-auto ${
                          item.status === "pending"
                            ? "bg-orange-300"
                            : item.status === "assigned"
                            ? "bg-purple-300"
                            : sortBy === "dispatched"
                            ? "bg-purple-300"
                            : sortBy === "delivered"
                            ? "bg-green-300"
                            : "bg-orange-300"
                        }`}
                      >
                        <Clock
                          color={
                            item.status === "pending"
                              ? "#9a3412"
                              : item.status === "assigned"
                              ? "#581c87"
                              : "#166534"
                          }
                          size={14}
                        />
                        <H5
                          className={`${
                            item.status === "pending"
                              ? "text-orange-900"
                              : item.status === "assigned"
                              ? "text-purple-900"
                              : "text-green-900"
                          } ml-2 text-base capitalize`}
                        >
                          {sortBy === "dispatched"
                            ? "dispatched"
                            : sortBy === "delivered"
                            ? "delivered"
                            : item.status}
                        </H5>
                      </View>
                    </View>

                    {/* Order Details */}
                    <View className="mb-6">
                      <H3 className="text-lg text-gray-800 mb-2">
                        {item.order.product.name}
                      </H3>
                      <H4
                        className="text-gray-600 text-base w-3/4"
                        numberOfLines={3}
                      >
                        {item.order.product.description}
                      </H4>
                    </View>

                    {/* Action Buttons */}
                    {item.status === "dispatched" ? (
                      <View className="bg-gray-100 py-2 px-4 rounded-lg mt-4">
                        <H4 className="text-gray-700 text-base">
                          {sortBy === "delivered"
                            ? "Delivered by: "
                            : "Assigned to: "}
                          {driverNames[item.id] || "Loading..."}{" "}
                        </H4>
                      </View>
                    ) : (
                      <View className="flex-row w-full gap-6 justify-between">
                        <Button
                          className="rounded-full border-black bg-transparent px-0"
                          size={"lg"}
                          variant="default"
                          disabled
                        >
                          <H5 className="text-black text-left">
                            {formatDate(item.created_at)} &#8226;{" "}
                            {formatTime(item.created_at)}
                          </H5>
                        </Button>
                        <AssignDriverModal
                          sheetTrigger={
                            <Button
                              className="rounded-full flex-1 bg-green-800 disabled:bg-zinc-800"
                              size={"lg"}
                              variant="default"
                              disabled={item.status === "assigned"}
                            >
                              <H5 className=" text-white">
                                {item.status === "assigned"
                                  ? "Assigned"
                                  : "Assign"}
                              </H5>
                            </Button>
                          }
                          order={item.order}
                          product={item.order.product}
                          dispatchId={item.dispatch_id}
                          visible={modalVisible && selectedOrderId === item.id}
                          drivers={availableDrivers}
                          onAssign={async () => {
                            console.log("Assigned");
                            await fetchCustomerOrders(); // Refetch orders after assignment
                          }}
                        />
                      </View>
                    )}
                  </View>
                </View>
              )}
            />
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
