import { createTheme } from "@mui/material/styles";

const theme = createTheme({
  palette: {
    mode: "dark",
    primary: {
      main: "#FFC850",
    },
    secondary: {
      main: "#FF8C42",
    },
    background: {
      default: "#0a0a14",
      paper: "rgba(255,255,255,0.04)",
    },
    text: {
      primary: "#F6F4EF",
      secondary: "#D1CDC3",
    },
  },
  shape: {
    borderRadius: 14,
  },
  typography: {
    fontFamily: '"Inter", "Segoe UI", sans-serif',
    h1: {
      fontFamily: '"Merriweather", Georgia, serif',
      fontWeight: 700,
    },
    h2: {
      fontFamily: '"Merriweather", Georgia, serif',
      fontWeight: 700,
    },
    h3: {
      fontFamily: '"Merriweather", Georgia, serif',
      fontWeight: 700,
    },
    h4: {
      fontFamily: '"Merriweather", Georgia, serif',
      fontWeight: 700,
    },
    h5: {
      fontFamily: '"Merriweather", Georgia, serif',
      fontWeight: 700,
    },
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          border: "1px solid rgba(255,255,255,0.14)",
          backdropFilter: "blur(8px)",
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          background: "rgba(255,255,255,0.06)",
          border: "1px solid rgba(255,255,255,0.14)",
          boxShadow: "0 10px 30px rgba(0,0,0,0.35)",
        },
      },
    },
    MuiButton: {
      defaultProps: {
        disableElevation: true,
      },
      styleOverrides: {
        root: {
          textTransform: "none",
          fontWeight: 600,
        },
      },
    },
  },
});

export default theme;
