import { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Messages from "@/components/messages/Messages";
import PageNotFound from "@/components/common/PageNotFound";

const AppRouter = () => {
    const { error } = useSelector(state => state.messageReducer);
    useEffect(() => {
        if (error) {
          alert(error);
        }
    }, [error]);
    return (
        <BrowserRouter>
            <div style={{minHeight: 'calc(100vh - 72px - 40px)', paddingTop: '24px'}}> {/* View height - header height - footer height */}
                <Routes>
                    <Route path="/" element={<Messages />} />
                    <Route path="*" element={<PageNotFound />} />
                </Routes>
                {error && alert}
            </div>
        </BrowserRouter>
    )
}

export default AppRouter;
