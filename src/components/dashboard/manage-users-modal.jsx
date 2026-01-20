"use client";

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import UserManagement from "./user-management";
import { Users } from "lucide-react";
import { useLanguage } from "@/lib/i18n";

export function ManageUsersModal({ open, onOpenChange }) {
    const { t } = useLanguage();

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[90vw] md:max-w-[85vw] lg:max-w-6xl max-h-[90vh] overflow-y-auto w-full">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-2xl font-bold">
                        <Users className="h-6 w-6 text-blue-600" />
                        {t("manage_users")}
                    </DialogTitle>
                </DialogHeader>
                <div className="pt-4">
                    <UserManagement />
                </div>
            </DialogContent>
        </Dialog>
    );
}
