import  FloatingActions from "@/app/under botton/page";
import Calendar from "@/components/Calendar";
import Image from "next/image";

   export default function Home() {
     return (
       <div >
      <main >
      <FloatingActions/>
        <Calendar />
      </main>
    </div>
  );
}