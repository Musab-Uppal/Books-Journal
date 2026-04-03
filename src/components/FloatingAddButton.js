import Link from "next/link";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import { Fab } from "@mui/material";

export function FloatingAddButton() {
  return (
    <Fab
      color="warning"
      component={Link}
      href="/add"
      aria-label="add-book"
      size="medium"
      sx={{ position: "fixed", bottom: 24, right: 24, zIndex: 30 }}
    >
      <AddRoundedIcon />
    </Fab>
  );
}
