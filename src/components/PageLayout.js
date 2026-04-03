import { Box, Container } from "@mui/material";
import { AppNavbar } from "@/components/AppNavbar";

export function PageLayout({ children, withNav = true }) {
  return (
    <Box className="app-shell">
      {withNav ? <AppNavbar /> : null}
      <Container maxWidth="lg" sx={{ pt: withNav ? 1.6 : 2.4, pb: 3 }}>
        {children}
      </Container>
    </Box>
  );
}
