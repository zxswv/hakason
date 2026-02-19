import  FloatingActions from "@/app/under botton/page";
import Calendar from "@/components/Calendar";
import VoiceRecorder from "@/components/voice";
import Image from "next/image";

   export default function Home() {
     return (
       <div >
      <main >
      {/* <FloatingActions/>
        <Calendar /> */}
        <VoiceRecorder />
      </main>
    </div>
  );
}