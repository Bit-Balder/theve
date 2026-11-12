import { mountStartView } from "./app";
import "./styles/fonts.css";
import "./styles/tokens.css";
import "./styles/base.css";
import "./styles/components.css";

const root = document.querySelector<HTMLElement>("#app");

if (!root) {
  throw new Error("Theve kunde inte hitta appens rotelement.");
}

mountStartView(root);
