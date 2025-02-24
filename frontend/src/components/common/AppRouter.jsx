import { BrowserRouter, Routes, Route } from "react-router-dom";
import Messages from "@/components/messages/Messages";
import PageNotFound from "@/components/common/PageNotFound";

const AppRouter = () => {
    return (
        <BrowserRouter>
            <div style={{minHeight: 'calc(100vh - 48px - 40px)'}}> {/* View height - header height - footer height */}
                <Routes>
                    <Route path="/" element={<Messages />} />
                    <Route path="*" element={<PageNotFound />} />
                </Routes>
            </div>
        </BrowserRouter>
    )
}

export default AppRouter;
