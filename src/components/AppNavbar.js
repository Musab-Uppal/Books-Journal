import Link from "next/link";
import { useRouter } from "next/router";
import MenuBookRoundedIcon from "@mui/icons-material/MenuBookRounded";
import LogoutRoundedIcon from "@mui/icons-material/LogoutRounded";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import {
  AppBar,
  Box,
  Button,
  Container,
  IconButton,
  Toolbar,
  Tooltip,
  Typography,
} from "@mui/material";
import toast from "react-hot-toast";
import { useAuth } from "@/context/AuthContext";

export function AppNavbar() {
  const router = useRouter();
  const { user, signOut } = useAuth();

  const links = [{ href: "/dashboard", label: "Dashboard" }];

  async function onSignOut() {
    try {
      await signOut();
      toast.success("Signed out");
      router.push("/login");
    } catch {
      // Handled by context.
    }
  }

  return (
    <AppBar
      position="sticky"
      color="transparent"
      sx={{
        borderBottom: "1px solid rgba(255,255,255,0.14)",
        backdropFilter: "blur(10px)",
        background: "rgba(10,12,25,0.75)",
      }}
    >
      <Container maxWidth="lg">
        <Toolbar disableGutters sx={{ gap: 1, minHeight: 58 }}>
          <MenuBookRoundedIcon sx={{ color: "#FFC850" }} />
          <Typography
            variant="subtitle1"
            component={Link}
            href="/dashboard"
            sx={{
              fontFamily: '"Merriweather", Georgia, serif',
              mr: 2,
              fontWeight: 700,
              letterSpacing: 0.2,
              textDecoration: "none",
            }}
          >
            Keep It Booked
          </Typography>

          <Box sx={{ display: "flex", gap: 1, flex: 1, alignItems: "center" }}>
            {user &&
              links.map((link) => {
                const active = router.pathname === link.href;
                return (
                  <Button
                    key={link.href}
                    component={Link}
                    href={link.href}
                    color={active ? "primary" : "inherit"}
                    sx={{ fontWeight: active ? 700 : 500 }}
                    size="small"
                  >
                    {link.label}
                  </Button>
                );
              })}
          </Box>

          {user && (
            <>
              <Tooltip title="Add Book">
                <IconButton
                  component={Link}
                  href="/add"
                  sx={{ color: "#FFC850" }}
                >
                  <AddRoundedIcon />
                </IconButton>
              </Tooltip>
              <Button
                onClick={onSignOut}
                variant="outlined"
                color="warning"
                startIcon={<LogoutRoundedIcon />}
                size="small"
              >
                Sign out
              </Button>
            </>
          )}
        </Toolbar>
      </Container>
    </AppBar>
  );
}
