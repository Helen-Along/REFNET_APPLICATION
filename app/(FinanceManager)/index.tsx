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
import {
  checkUser,
  fetchAllFinancialRecords,
  updateFinanceStatus,
} from "~/lib/supabase";
import { supabase } from "~/lib/supabase";
import { RepairCard } from "~/components/RepairCard";
import { useEmail } from "../EmailContext";
import { H1, H2, H3, H4, H5, P } from "~/components/ui/typography";
import { FinanceItem } from "~/components/FinanceItem";
import {
  ArrowDown,
  ArrowUp,
  CreditCard,
  GalleryVerticalEnd,
  ListChecks,
  ListTodo,
} from "lucide-react-native";
import StatsCard from "~/components/StatsCard";
import { formatBalance } from "~/lib/formatBalance";
import { OrderCard } from "~/components/OrderCard";
import { Button } from "~/components/ui/button";
import { AssignTechnicianModal } from "~/components/sheets/assignTechnician";
import displayNotification from "~/lib/Notification";
import { formatTime } from "~/lib/format-time";
import { formatDate } from "~/lib/format-date";

type Technician = {
  id: number;
  name: string;
  speciality: string;
};

const ORDERS_PER_PAGE = 3;
const SERVICES_PER_PAGE = 3;

export default function Page() {
  type OrderStatus = "pending" | "approved";
  type Order = {
    id: number;
    deviceName: string;
    deviceType: string;
    issueDescription: string;
    status: string;
    dueDate: string;
    requiredProducts: { name: string; quantity: number }[];
    orderNotes: string;
  };
  const emailContext = useEmail();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [technicianId, setTechnicianId] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState("all-orders");
  const [financeRecords, setFinanceRecords] = useState([]);
  const [stats, setStats] = useState([
    {
      iconBgColor: "bg-purple-600",
      Icon: <CreditCard color="white" size={19} />,
      Title: "Acc. Balance",
      Description: `KSh ${
        formatBalance(financeRecords[financeRecords.length - 1]?.balance) || 0
      }`,
    },
    {
      iconBgColor: "bg-green-600",
      Icon: <ArrowUp color="white" size={19} />,
      Title: "Revenue",
      Description: "Ksh 0",
    },
    {
      iconBgColor: "bg-red-600",
      Icon: <ArrowDown color="white" size={19} />,
      Title: "Expenses",
      Description: "$876,543",
    },
    {
      iconBgColor: "bg-blue-600",
      Icon: <ArrowUp color="white" size={19} />,
      Title: "Profit",
      Description: "$358,024",
    },
  ]);
  const [refreshing, setRefreshing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [servicesCurrentPage, setServicesCurrentPage] = useState(1);
  const [repairs, setRepairs] = useState<Order[]>([]);
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
  const [filterStatus, setFilterStatus] = useState<
    "All" | "pending" | "approved"
  >("All");
  const skeletons = [0, 1, 2, 3, 4, 5, 6];
  const [selectedRepair, setSelectedRepair] = useState(null);
  const [restockRequests, setRestockRequests] = useState([]);
  const [restockCurrentPage, setRestockCurrentPage] = useState(1);
  const [restockFilterStatus, setRestockFilterStatus] = useState("All");
  const RESTOCK_PER_PAGE = 3;

  useEffect(() => {
    fetchAllOrders();
    fetchRepairs();
    fetchRestockRequests();
    const subscription = supabase
      .channel("orders")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders" },
        handleRepairChange
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [technicianId]); // Add technicianId as a dependency

  const handleAssign = (orderId: number) => {
    setSelectedOrderId(orderId);
    setModalVisible(true);
  };

  useEffect(() => {
    async function fetchFinanceRecords() {
      const response = await fetchAllFinancialRecords();
      setFinanceRecords(response);

      // Calculate total amount, revenue from incoming payments, and expenses
      const totalAmount = response.reduce(
        (total, record) => total + record.amount,
        0
      );
      const revenue = response.reduce((total, record) => {
        return record.payment_type === "incoming"
          ? total + record.amount
          : total;
      }, 0);

      // Calculate expenses
      const expenses = response.reduce((total, record) => {
        return record.payment_type === "outgoing"
          ? total + record.amount
          : total;
      }, 0);

      // Calculate profit
      const profit = revenue - expenses;

      // Calculate revenue and expenses percentage
      const revenuePercentage =
        totalAmount > 0 ? (revenue / totalAmount) * 100 : 0;
      const expensesPercentage =
        totalAmount > 0 ? (expenses / totalAmount) * 100 : 0;

      // Update the revenue and profit in stats
      console.log("Calc revenue percentage:", revenuePercentage);
      console.log("Calc profit:", profit);
      setStats((prevStats) => {
        const updatedStats = [...prevStats];
        updatedStats[1].Description = `${revenuePercentage.toFixed(2)}%`; // Update revenue description to show percentage
        updatedStats[2].Description = `${expensesPercentage.toFixed(
          1
        )}% per year`; // Update expenses description to show percentage
        updatedStats[3].Description = `KSh ${formatBalance(profit)}`; // Update profit description

        // Update account balance in stats
        const latestBalance = response[response.length - 1]?.balance || 0; // Get the latest balance
        updatedStats[0].Description = `KSh ${formatBalance(latestBalance)}`; // Update account balance description

        return updatedStats;
      });
    }
    fetchFinanceRecords();
    async function fetchUserDetails() {
      if (!emailContext || !emailContext.email) {
        console.error("Email context is not available");
        return;
      }

      const response = await checkUser(emailContext.email);
      if (!response || !response.user_id) {
        console.error("User details could not be fetched");
        return;
      }

      console.log("Username", response.full_name);
      const userId = response.user_id;

      setTechnicianId(userId);
    }
    fetchUserDetails();
  }, [emailContext]);

  const fetchAllOrders = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from("orders")
        .select("*, products:product_id(*), users:user_id(*)")
        .order("created_at", { ascending: false }); // Sort by newest first

      if (error) throw error;
      setOrders(data || []);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An unknown error occurred"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateStatus = async (
    orderId: number,
    newStatus: OrderStatus
  ) => {
    try {
      const { error } = await supabase
        .from("orders")
        .update({ status: newStatus })
        .eq("id", orderId);

      if (error) throw error;

      Alert.alert("Success", `Order status updated to ${newStatus}`);
      setIsModalVisible(false);
      fetchAllOrders();
    } catch (err) {
      Alert.alert(
        "Error",
        err instanceof Error ? err.message : "An unknown error occurred"
      );
    }
  };

  const getSortedOrders = () => {
    switch (sortBy) {
      case "pending":
        return orders.filter((order) => order.finance_approval === "pending");
      case "approved":
        return orders.filter((order) => order.finance_approval === "approved");
      case "declined":
        return orders.filter((order) => order.finance_approval === "declined");
      default:
        return orders;
    }
  };

  const sortedOrders = getSortedOrders();

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchAllOrders();
    setRefreshing(false);
  };

  const paginatedOrders = sortedOrders.slice(
    (currentPage - 1) * ORDERS_PER_PAGE,
    currentPage * ORDERS_PER_PAGE
  );

  const totalPages = Math.ceil(sortedOrders.length / ORDERS_PER_PAGE);

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

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
        .update({ finance_status: "approved" })
        .eq("id", repairId);

      if (error) throw error;

      displayNotification("Repair has been approved", "success");
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
    const filteredRepairs = repairs.filter((repair) => {
      if (filterStatus === "All") return true;
      return repair.finance_status === filterStatus;
    });

    switch (sortBy) {
      case "pending":
        return filteredRepairs.filter(
          (repair) => repair.finance_status === "pending"
        );
      case "inprogress":
        return filteredRepairs.filter(
          (repair) => repair.finance_status === "inprogress"
        );
      case "completed":
        return filteredRepairs.filter(
          (repair) => repair.finance_status === "completed"
        );
      default:
        return filteredRepairs;
    }
  };

  const sortedRepairs = getSortedRepairs();

  const sortedServices = getSortedRepairs(); // Reusing the repairs data for services

  const paginatedServices = sortedServices.slice(
    (servicesCurrentPage - 1) * SERVICES_PER_PAGE,
    servicesCurrentPage * SERVICES_PER_PAGE
  );

  const servicesTotalPages = Math.ceil(
    sortedServices.length / SERVICES_PER_PAGE
  );

  const handleNextServicesPage = () => {
    if (servicesCurrentPage < servicesTotalPages) {
      setServicesCurrentPage(servicesCurrentPage + 1);
    }
  };

  const handlePreviousServicesPage = () => {
    if (servicesCurrentPage > 1) {
      setServicesCurrentPage(servicesCurrentPage - 1);
    }
  };

  const pendingApprovalRepairs = repairs.filter((r) => r.status === "pending");

  const fetchRepairs = async () => {
    setError(null);
    try {
      const { data, error } = await supabase
        .from("repairs")
        .select(
          "*, services(*), users:customer_id(full_name), products:product_id(*), technicians:technician_id(full_name)"
        )
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

  const filteredRepairs = repairs.filter((order) => {
    if (filterStatus === "All") return true;
    return order.status === filterStatus;
  });

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const fetchRestockRequests = async () => {
    try {
      const { data, error } = await supabase
        .from("restock")
        .select("*, products:product_id(*)")
        .order("created_at", { ascending: false });
      console.log("Restock Data: >> ", data);

      if (error) throw error;
      setRestockRequests(data || []);
    } catch (err) {
      console.error("Error fetching restock requests:", err);
    }
  };

    const handleRestockApproval = async (restockId, status) => {
    try {
      // First get the restock request details to calculate the cost
      const { data: restockData, error: restockError } = await supabase
        .from("restock")
        .select("*, products:product_id(*)")
        .eq("id", restockId)
        .single();
  
      if (restockError) throw restockError;

      
      // Calculate total cost
      const productPrice = restockData.products.price || 0;
      const quantity = restockData.stock_amount || 0;
      const totalCost = Number(productPrice) * Number(quantity);
      
      // Get latest balance from financial_records
      const { data: financeData, error: financeError } = await supabase
      .from("financial_records")
      .select("balance")
      .order("created_at", { ascending: false })
      .limit(1);
      
      console.log("Total Cost: >> ", financeData);
      if (financeError) throw financeError;
      
      const currentBalance = financeData.length > 0 ? financeData[0].balance : 0;
      const newBalance = currentBalance - totalCost;
      
      // Add record to financial_records
      const { error: recordError } = await supabase
        .from("financial_records")
        .insert({
          amount: totalCost,
          balance: newBalance,
          payment_type: "outgoing",
          description: `Restock of ${quantity} units of ${restockData.products.name}`,
          employee_id: technicianId, // Add the current user's ID        });
        })
      if (recordError) throw recordError;
      
      // Update restock status
      const { error: updateError } = await supabase
        .from("restock")
        .update({ finance_approval: 'approved' })
        .eq("id", restockId);
  
      if (updateError) throw updateError;
  
      displayNotification(`Restock request ${status}`, "success");
      fetchRestockRequests();
      // Refresh finance records to update displayed balance
      fetchAllFinancialRecords().then(response => setFinanceRecords(response));
    } catch (err) {
      Alert.alert(
        "Error",
        err instanceof Error ? err.message : "An unknown error occurred"
      );
    }
  };

   const handleRestockDecline = async (restockId, status) => {
     try {
       const { error } = await supabase
         .from("restock")
         .update({ finance_approval: "decline" })
         .eq("id", restockId);

       if (error) throw error;

       displayNotification(`Restock request ${status}`, "success");
       fetchRestockRequests();
     } catch (err) {
       Alert.alert(
         "Error",
         err instanceof Error ? err.message : "An unknown error occurred"
       );
     }
   };

  const getFilteredRestockRequests = () => {
    return restockRequests.filter((request) => {
      if (restockFilterStatus === "All") return true;
      return request.finance_approval === restockFilterStatus.toLowerCase();
    });
  };

  const filteredRestockRequests = getFilteredRestockRequests();
  const paginatedRestockRequests = filteredRestockRequests.slice(
    (restockCurrentPage - 1) * RESTOCK_PER_PAGE,
    restockCurrentPage * RESTOCK_PER_PAGE
  );
  const restockTotalPages = Math.ceil(
    filteredRestockRequests.length / RESTOCK_PER_PAGE
  );

  const handleNextRestockPage = () => {
    if (restockCurrentPage < restockTotalPages) {
      setRestockCurrentPage(restockCurrentPage + 1);
    }
  };

  const handlePreviousRestockPage = () => {
    if (restockCurrentPage > 1) {
      setRestockCurrentPage(restockCurrentPage - 1);
    }
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
          onPress={fetchAllOrders}
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

        {/* Orders Section */}
        <View className="flex-row p-2 pt-4 justify-between items-center">
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="flex-row gap-2"
          >
            {["all-orders", "pending", "approved", "declined"].map(
              (sort, index) => (
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

        <View className="p-4">
          {paginatedOrders.map((selectedOrder, index) => (
            <OrderCard
              key={index}
              order={selectedOrder}
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
        </View>

        {/* Services Section */}
        <View className="bg-white p-4 mt-4">
          <H3 className="text-black mb-4">Services</H3>

          <View className="flex-row mb-4 gap-2">
            <TouchableOpacity
              className={`px-3 py-1 rounded-full ${
                filterStatus === "All" ? "bg-zinc-800" : "bg-zinc-200"
              }`}
              onPress={() => setFilterStatus("All")}
            >
              <P
                className={filterStatus === "All" ? "text-white" : "text-black"}
              >
                All
              </P>
            </TouchableOpacity>
            <TouchableOpacity
              className={`px-3 py-1 rounded-full ${
                filterStatus === "pending" ? "bg-zinc-800" : "bg-zinc-200"
              }`}
              onPress={() => setFilterStatus("pending")}
            >
              <P
                className={
                  filterStatus === "pending" ? "text-white" : "text-black"
                }
              >
                Pending
              </P>
            </TouchableOpacity>
            <TouchableOpacity
              className={`px-3 py-1 rounded-full ${
                filterStatus === "approved" ? "bg-zinc-800" : "bg-zinc-200"
              }`}
              onPress={() => setFilterStatus("approved")}
            >
              <P
                className={
                  filterStatus === "approved" ? "text-white" : "text-black"
                }
              >
                approved
              </P>
            </TouchableOpacity>
          </View>

          {paginatedServices.length > 0 ? (
            paginatedServices.map((service, index) => (
              <View key={index} className="bg-zinc-100 rounded-lg p-4 mb-4">
                <View className="flex-row justify-between items-center mb-2">
                  <H4 className="text-black">Service #{service.id}</H4>
                  <View
                    className={`px-2 py-1 rounded-md ${
                      service.finance_status === "pending"
                        ? "bg-amber-100"
                        : service.finance_status === "inprogress"
                        ? "bg-blue-100"
                        : "bg-green-100"
                    }`}
                  >
                    <P
                      className={`${
                        service.finance_status === "pending"
                          ? "text-amber-800"
                          : service.finance_status === "inprogress"
                          ? "text-blue-800"
                          : "text-green-800"
                      } capitalize`}
                    >
                      {service.finance_status}
                    </P>
                  </View>
                </View>

                <View className="mb-2">
                  <P className="text-zinc-500">
                    Customer: {service.users?.full_name || "N/A"}
                  </P>
                  <P className="text-zinc-500">
                    Technician:{" "}
                    {service.technicians?.full_name || "Not approved"}
                  </P>
                  <P className="text-zinc-500">
                    Product: {service.products?.name || "N/A"}
                  </P>
                  <P className="text-zinc-500">
                    Repair Date: {formatDate(service.created_at)} {formatTime(service.created_at)}
                  </P>
                </View>

                <View className="flex-row justify-between mt-2 gap-4">
                  {service.finance_status === "pending" && (
                    <Button
                      className="rounded-full flex-1 bg-green-800"
                      onPress={() => handleApproveRepair(service.id)}
                      size={"lg"}
                    >
                      <H4 className="text-white">Approve</H4>
                    </Button>
                  )}

                  {service.finance_approval === "pending" && (
                    <Button
                      className="bg-blue-600 rounded-full px-4"
                      onPress={() =>
                        updateFinanceStatus(service.id, "approved")
                      }
                    >
                      <P className="text-white">Finance Approve</P>
                    </Button>
                  )}
                </View>
              </View>
            ))
          ) : (
            <View className="py-8 items-center">
              <P className="text-zinc-500">No services found</P>
            </View>
          )}

          {paginatedServices.length > 0 && (
            <View className="flex-row items-center justify-between my-4 w-full">
              <Button
                className="bg-[#111] rounded-full px-10 py-2 disabled:bg-zinc-900"
                size={"lg"}
                onPress={handlePreviousServicesPage}
                disabled={servicesCurrentPage === 1}
              >
                <H4 className="text-white text-sm">&larr; Previous</H4>
              </Button>

              <P className="text-black text-sm mx-4">
                Page {servicesCurrentPage} of {servicesTotalPages}
              </P>

              <Button
                className="bg-[#111] rounded-full px-10 py-2 disabled:bg-zinc-900"
                size={"lg"}
                onPress={handleNextServicesPage}
                disabled={servicesCurrentPage === servicesTotalPages}
              >
                <H4 className="text-white text-sm">Next &rarr;</H4>
              </Button>
            </View>
          )}
        </View>

        {/* Product restock approval section */}
        <View className="bg-white p-4 mt-4">
          <H3 className="text-black mb-4">Product Restock Requests</H3>

          <View className="flex-row mb-4 gap-2">
            <TouchableOpacity
              className={`px-3 py-1 rounded-full ${
                restockFilterStatus === "All" ? "bg-zinc-800" : "bg-zinc-200"
              }`}
              onPress={() => setRestockFilterStatus("All")}
            >
              <P
                className={
                  restockFilterStatus === "All" ? "text-white" : "text-black"
                }
              >
                All
              </P>
            </TouchableOpacity>
            <TouchableOpacity
              className={`px-3 py-1 rounded-full ${
                restockFilterStatus === "pending"
                  ? "bg-zinc-800"
                  : "bg-zinc-200"
              }`}
              onPress={() => setRestockFilterStatus("pending")}
            >
              <P
                className={
                  restockFilterStatus === "pending"
                    ? "text-white"
                    : "text-black"
                }
              >
                Pending
              </P>
            </TouchableOpacity>
            <TouchableOpacity
              className={`px-3 py-1 rounded-full ${
                restockFilterStatus === "approved"
                  ? "bg-zinc-800"
                  : "bg-zinc-200"
              }`}
              onPress={() => setRestockFilterStatus("approved")}
            >
              <P
                className={
                  restockFilterStatus === "approved"
                    ? "text-white"
                    : "text-black"
                }
              >
                Approved
              </P>
            </TouchableOpacity>
            <TouchableOpacity
              className={`px-3 py-1 rounded-full ${
                restockFilterStatus === "declined"
                  ? "bg-zinc-800"
                  : "bg-zinc-200"
              }`}
              onPress={() => setRestockFilterStatus("declined")}
            >
              <P
                className={
                  restockFilterStatus === "declined"
                    ? "text-white"
                    : "text-black"
                }
              >
                Declined
              </P>
            </TouchableOpacity>
          </View>

          {paginatedRestockRequests.length > 0 ? (
            paginatedRestockRequests.map((request, index) => (
              <View key={index} className="bg-zinc-100 rounded-lg p-4 mb-4">
                <View className="flex-row justify-between items-center mb-2">
                  <H4 className="text-black">
                    {request.products?.name || "Unknown Product"}
                  </H4>
                  <View
                    className={`px-2 py-1 rounded-md ${
                      request.finance_approval === "pending"
                        ? "bg-amber-100"
                        : request.finance_approval === "approved"
                        ? "bg-green-100"
                        : "bg-red-100"
                    }`}
                  >
                    <P
                      className={`${
                        request.finance_approval === "pending"
                          ? "text-amber-800"
                          : request.finance_approval === "approved"
                          ? "text-green-800"
                          : "text-red-800"
                      } capitalize`}
                    >
                      {request.finance_approval}
                    </P>
                  </View>
                </View>

                <View className="mb-3">
                  <P className="text-zinc-500">
                    Current Stock: {request.products?.stock_quantity || 0} units
                  </P>
                  <P className="text-zinc-500">
                    Requested Amount: {request.stock_amount} Units
                  </P>
                  <P className="text-zinc-500">
                    Requested On:{" "}
                    {new Date(request.created_at).toLocaleDateString()} -{" "}
                    {formatTime(request.created_at)}
                  </P>
                </View>

                {request.finance_approval === "pending" && (
                  <View className="flex-row justify-between mt-2 gap-4">
                    <Button
                      variant="outline"
                      className="bg-transparent border border-red-500 rounded-full px-6 flex-1"
                      onPress={() =>
                        handleRestockDecline(request.id, "declined")
                      }
                      size={"lg"}
                    >
                      <P className="text-red-500">Decline</P>
                    </Button>

                    <Button
                      className="rounded-full flex-1 bg-green-800"
                      onPress={() =>
                        handleRestockApproval(request.id, "approved")
                      }
                      size={"lg"}
                    >
                      <H4 className="text-white">Approve</H4>
                    </Button>
                  </View>
                )}
              </View>
            ))
          ) : (
            <View className="py-8 items-center">
              <P className="text-zinc-500">No restock requests found</P>
            </View>
          )}

          {paginatedRestockRequests.length > 0 && (
            <View className="flex-row items-center justify-between my-4 w-full">
              <Button
                className="bg-[#111] rounded-full px-10 py-2 disabled:bg-zinc-900"
                size={"lg"}
                onPress={handlePreviousRestockPage}
                disabled={restockCurrentPage === 1}
              >
                <H4 className="text-white text-sm">&larr; Previous</H4>
              </Button>

              <P className="text-black text-sm mx-4">
                Page {restockCurrentPage} of {restockTotalPages}
              </P>

              <Button
                className="bg-[#111] rounded-full px-10 py-2 disabled:bg-zinc-900"
                size={"lg"}
                onPress={handleNextRestockPage}
                disabled={restockCurrentPage === restockTotalPages}
              >
                <H4 className="text-white text-sm">Next &rarr;</H4>
              </Button>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
