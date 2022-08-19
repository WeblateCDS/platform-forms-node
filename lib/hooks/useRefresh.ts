import { useEffect, useState } from "react";
import { useRouter } from "next/router";

/**
 * @description Function that watches for changes on props and initiates a server side props refresh
 * @param data The props or values that will be refreshed
 * @returns Object containing the refreshData function and isRefreshing boolean
 */
export const useRefresh = (
  data: unknown[] | undefined
): { refreshData: () => Promise<void>; isRefreshing: boolean } => {
  const router = useRouter();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const refreshData = async () => {
    setIsRefreshing(true);
    await router.replace(router.asPath);
  };

  useEffect(() => {
    setIsRefreshing(false);
  }, data);

  return { refreshData, isRefreshing };
};