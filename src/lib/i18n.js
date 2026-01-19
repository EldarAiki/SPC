"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

const dictionary = {
    en: {
        // Navbar
        club_name: "Poker Club",
        logout: "Log out",
        code: "Code",
        login: "Login",
        register: "Register",
        activate_account: "Activate Account",

        // Dashboard
        personal_stats: "Personal Statistics",
        my_club: "My Club",
        overview: "Overview",
        admin_panel: "Admin Panel",
        balance: "Balance",
        rakeback: "Rakeback",
        recent_games: "Recent Games",
        export_excel: "Export Excel",
        date: "Date",
        type: "Type",
        table: "Table",
        buy_in: "Buy-in",
        cash_out: "Cash-out",
        pnl: "P&L",
        status: "Status",
        actions: "Actions",

        // Admin
        data_upload: "Data Upload",
        report_file: "Report File (XLSX)",
        upload_success: "Upload successful!",
        upload_failed: "Upload failed",
        cycle_mgmt: "Cycle Management",
        current_cycle: "Current Cycle",
        close_cycle: "Close Current Cycle",
        manage_users: "Manage Users",

        // Agent
        set_rakeback: "Set Rakeback",
        details: "Details",
        download_report: "Download Report",
        search_players: "Search players...",
    },
    he: {
        // Navbar
        club_name: "מועדון פוקר",
        logout: "התנתק",
        code: "קוד",
        login: "התחברות",
        register: "הרשמה",
        activate_account: "הפעלת חשבון",

        // Dashboard
        personal_stats: "סטטיסטיקה אישית",
        my_club: "המועדון שלי",
        overview: "סקירה כללית",
        admin_panel: "פאנל ניהול",
        balance: "יתרה",
        rakeback: "רייקבק",
        recent_games: "משחקים אחרונים",
        export_excel: "ייצוא לאקסל",
        date: "תאריך",
        type: "סוג",
        table: "שולחן",
        buy_in: "ביי-אין",
        cash_out: "קאש-אאוט",
        pnl: "רווח/הפסד",
        status: "סטטוס",
        actions: "פעולות",

        // Admin
        data_upload: "העלאת נתונים",
        report_file: "קובץ דוח (XLSX)",
        upload_success: "העלאה הצליחה!",
        upload_failed: "העלאה נכשלה",
        cycle_mgmt: "ניהול מחזורים",
        current_cycle: "מחזור נוכחי",
        close_cycle: "סגור מחזור נוכחי",
        manage_users: "ניהול משתמשים",

        // Agent
        set_rakeback: "הגדר רייקבק",
        details: "פרטים",
        download_report: "הורד דוח",
        search_players: "חפש שחקנים...",
    },
};

const LanguageContext = createContext();

export function LanguageProvider({ children }) {
    const [language, setLanguage] = useState("he"); // Default to Hebrew

    useEffect(() => {
        const saved = localStorage.getItem("language");
        if (saved) setLanguage(saved);
    }, []);

    const toggleLanguage = () => {
        const newLang = language === "en" ? "he" : "en";
        setLanguage(newLang);
        localStorage.setItem("language", newLang);
    };

    const t = (key) => {
        return dictionary[language][key] || key;
    };

    const dir = language === "he" ? "rtl" : "ltr";

    return (
        <LanguageContext.Provider value={{ language, toggleLanguage, t, dir }}>
            <div dir={dir}>{children}</div>
        </LanguageContext.Provider>
    );
}

export const useLanguage = () => useContext(LanguageContext);
