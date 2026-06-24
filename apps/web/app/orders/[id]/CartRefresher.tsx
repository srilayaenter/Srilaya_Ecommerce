"use client";

import { useEffect } from "react";
import { useCart } from "@/context/CartContext";

export default function CartRefresher() {
  const { refreshCartCount } = useCart();

  useEffect(() => {
    refreshCartCount();
  }, []);

  return null;
}