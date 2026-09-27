import { ArrowUpRight } from "lucide-react";
import "./login.css";
export default function LoginCTA() {
  return <div className="login-control"><a href="/login" className="register compact login-button">LOGIN <ArrowUpRight aria-hidden="true" /></a></div>;
}
