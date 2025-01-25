import type { StrapiApp } from "@strapi/strapi/admin";

export default {
  config: {
    head: {
      title: "CSITA BMC",

      favicon:
        "https://res.cloudinary.com/dol8m5gx7/image/upload/v1723191383/logohero_nsqj8h.png",
    },
    theme: {
      light: {
        colors: {
          primary800: "#136db1",
          primary700: "#136db1",
          primary600: "#136db1",
          primary500: "#136db1",
          buttonPrimary800: "#dc2626",
          buttonPrimary700: "#dc2626",
          buttonPrimary600: "#dc2626",
          buttonPrimary500: "#dc2626",
          buttonPrimary200: "#dc2626",
          buttonPrimary100: "#dc2626",
        },
      },
      dark: {
        colors: {
          primary800: "#136db1",
          primary700: "#136db1",
          primary600: "#136db1",
          primary500: "#136db1",
          buttonPrimary800: "#dc2626",
          buttonPrimary700: "#dc2626",
          buttonPrimary600: "#dc2626",
          buttonPrimary500: "#dc2626",
          buttonPrimary200: "#dc2626",
          buttonPrimary100: "#dc2626",
        },
      },
    },
  },
  bootstrap(app: StrapiApp) {},
};
