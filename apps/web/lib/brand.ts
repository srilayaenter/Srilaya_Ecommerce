export const BRAND = {
  name: "SriLaYa Enterprises",
  tagline: "Pure & Organic Foods",
  domain: "srilaya.com",
  gstin: process.env.BRAND_GSTIN || "29XXXXX1234X1ZX",
  address: "Bengaluru, Karnataka, India",
  email: "info@srilaya.com",
  phone: "+91 86603 21315",

  colors: {
    primary: "#4F46E5",
    primaryDark: "#4338CA",
    accent: "#06890f",
    text: "#1F2937",
    bg: "#F9FAFB",
    muted: "#6B7280",
  },

  social: {
    facebook: "",
    instagram: "",
    twitter: "",
  },

  business: {
    gstRate: 5,
    shippingFee: 50,
    minOrderAmount: 500,
  },
};

export type BrandConfig = typeof BRAND;