import { RiNotification2Line, RiNotificationOffLine } from "react-icons/ri";

export default function Notifications() {
  return <section className="w-full h-full p-5  bg-zinc-900">
    <h1 className="flex gap-5 items-center text-white text-2xl font-bold"><RiNotification2Line />Notifications</h1>
    <div className="flex items-center justify-center w-full h-full ">
      <p className="flex flex-col items-center justify-center text-white text-2xl font-bold ">
        <RiNotificationOffLine className="text-7xl mb-10" />
        Your cluster Notifications will be shown here.
      </p>
    </div>
  </section>
}
