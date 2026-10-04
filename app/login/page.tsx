import LoginScreen from "@/components/login/LoginScreen";
import { currentParticipant } from "@/lib/server/auth";
import { redirect } from "next/navigation";
export const metadata = { title: "Participant Login — CryptX" };
export default async function LoginPage() { if(await currentParticipant())redirect("/dashboard");return <LoginScreen />; }
