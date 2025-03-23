import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { MapPin, Clock, Package, ListTodo } from 'lucide-react-native';
import { H3, H4, H5, P } from './ui/typography';
import { formatDate } from '~/lib/format-date';
import { formatTime } from '~/lib/format-time';
import { Button } from './ui/button';
import { DispatchDetails } from './sheets/dispatchDetails';
import { supabase, updateDispatchStatus } from '~/lib/supabase';
import displayNotification from '~/lib/Notification';

type DispatchCardProps = {
  dispatch: any;
  onViewDetails: (orderId: number) => void;
};

export const DispatchCard: React.FC<DispatchCardProps> = ({ dispatch, onViewDetails }) => {
  const markAsComplete = async () => {
    try {
      const { data, error } = await supabase
        .from("dispatches")
        .update({ status: "complete", driver_status: "delivered" })
        .eq("order_id", dispatch.order_id);

      if (!error) {
        const { error: orderError } = await supabase
          .from("orders")
          .update({ dispatch_status: "delivered" })
          .eq("order_id", dispatch.order_id);

        if (orderError) {
          throw new Error(orderError.message);
        }
      }
      if (error) {
        displayNotification(
          `Error marking as complete: ${error.message}`,
          "danger"
        );
      } else {
        displayNotification("Dispatch marked as complete", "success");
      }
    } catch (err) {
      displayNotification(`Error: ${err.message}`, "danger");
    }
  };

  const handleDriverStatusDecline = async () => {
    try {
      const { data, error } = await supabase
        .from("dispatches")
        .update({ driver_status: "declined" })
        .eq("order_id", dispatch.order_id)
        .single();
      if (error) {
        displayNotification(
          `Error declining the dispatch: ${error.message}`,
          "danger"
        );
      } else {
        displayNotification("Dispatch marked as declined", "success");
      }
    } catch (err) {
      displayNotification(`Error: ${err.message}`, "danger");
    }
  };

  return (
    <View className="bg-white rounded-lg shadow-sm p-4 mb-4">
      <View className="flex-row justify-between w-full relative overflow-clip">
        <View className="flex-row items-center mb-1">
          <H3 className="text-xl text-gray-600">
            {formatDate(dispatch.dispatch_date)}
          </H3>
        </View>
        <View className="flex items-start absolute right-[-14px] top-[-14px]">
          <TouchableOpacity
            className={`p-2 px-4 rounded-bl-lg rounded-tr-lg flex-row items-center w-auto ${
              dispatch.driver_status === "pending"
                ? "bg-orange-300"
                : dispatch.driver_status === "declined"
                ? "bg-red-300"
                : dispatch.driver_status === "delivered"
                ? "bg-green-300"
                : "bg-purple-300"
            }`}
          >
            <ListTodo
              color={`${
                dispatch.driver_status === "pending"
                  ? "#9a3412"
                  : dispatch.driver_status === "declined"
                  ? "#7f1d1d"
                  : dispatch.driver_status === "delivered"
                  ? "#166534"
                  : "#581c87"
              }`}
              size={19}
            />
            <H5
              className={`${
                dispatch.driver_status === "pending"
                  ? "text-orange-900"
                  : dispatch.driver_status === "declined"
                  ? "text-red-900"
                  : dispatch.driver_status === "delivered"
                  ? "text-green-900"
                  : "text-purple-900"
              } ml-2 text-base capitalize`}
            >
              {dispatch.driver_status}
            </H5>
          </TouchableOpacity>
        </View>
      </View>
      <View className="flex-row items-center mb-1">
        <P className="text-sm text-gray-600">
          {formatTime(dispatch.dispatch_date)}
        </P>
      </View>
      <View className="mb-6">
        <H3 className="text-lg text-gray-600" numberOfLines={1}>
          {dispatch.order.product.name}
        </H3>
        <P className="text-base text-gray-600" numberOfLines={1}>
          {dispatch.order.product.description}
        </P>
      </View>

      <View className="flex-row gap-4 w-full justify-between">
        <Button
          disabled={
            dispatch.driver_status === "accepted" ||
            dispatch.driver_status === "declined" ||
            dispatch.driver_status === "delivered"
          }
          className={`rounded-full border-black bg-transparent ${
            dispatch.driver_status === "accepted"
              ? "border-0 p-0"
              : dispatch.driver_status === "declined"
              ? "border-0 p-0 px-2"
              : dispatch.driver_status === "delivered"
              ? "border-0 p-0 px-2"
              : "border-2"
          } `}
          size={"lg"}
          variant="default"
          onPress={() => handleDriverStatusDecline()}
        >
          <H5 className=" text-black">
            {dispatch.driver_status === "accepted"
              ? formatDate(dispatch.updated_at)
              : dispatch.driver_status === "declined"
              ? "Declined"
              : dispatch.driver_status === "delivered"
              ? formatDate(dispatch.updated_at)
              : "Decline"}
          </H5>
        </Button>
        {dispatch.driver_status === "accepted" ? (
          <Button
            className="rounded-full flex-1 bg-green-800 disabled:bg-zinc-900"
            size={"lg"}
            variant="default"
            onPress={markAsComplete}
          >
            <H5 className=" text-white disabled:text-black">
              {"Mark as Complete"}
            </H5>
          </Button>
        ) : dispatch.driver_status === "delivered" ? (
          <Button
            className="rounded-full flex-1 bg-green-800 disabled:bg-zinc-900"
            size={"lg"}
            variant="default"
            onPress={markAsComplete}
            disabled
          >
            <H5 className=" text-white disabled:text-black">
              {"Mark as Complete"}
            </H5>
          </Button>
        ) : (
          <DispatchDetails
            sheetTrigger={
              <Button
                disabled={dispatch.driver_status === "accepted"}
                className="rounded-full flex-1 bg-green-800 disabled:bg-zinc-900"
                size={"lg"}
                variant="default"
              >
                <H5 className=" text-white disabled:text-black">{"Accept"}</H5>
              </Button>
            }
            action="accept"
            dispatch={dispatch}
          />
        )}
      </View>
    </View>
  );
};

