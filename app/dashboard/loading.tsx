import Loader from "@/components/ui/Loader";

export default function DashboardLoading() {
    return (
        <div className="w-full h-[70vh] flex items-center justify-center">
            <Loader size="lg" text="Завантаження..." />
        </div>
    );
}
