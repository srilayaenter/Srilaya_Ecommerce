export const BRAND = {
  name: "SriLaYa Naturals",
  tagline: "Pure & Organic Foods",
  domain: "srilaya.com",
  gstin: process.env.BRAND_GSTIN || "29AYOPD6369H1ZV",
  address: "Bengaluru, Karnataka, India",
  addressFull: "White Field Hoskote Main Road, Seegehalli, Bengaluru, Karnataka - 560067",
  email: "info@srilaya.com",
  phone: "+91 86603 21315",

  colors: {
    primary: "#006A38",
    primaryDark: "#00522B",
    accent: "#8D6E63",
    text: "#212121",
    bg: "#F5F5F5",
    muted: "#9E9E9E",
  },

  social: {
    facebook: "",
    instagram: "https://www.instagram.com/srilayaenterprises",
    twitter: "",
  },

  business: {
    gstRate: 5,
    shippingFee: 50,
    minOrderAmount: 500,
  },
};

export type BrandConfig = typeof BRAND;